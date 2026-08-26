import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { AppUser } from '../types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wucnvwjkbvrsghkdumbh.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1Y252d2prYnZyc2doa2R1bWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjMyODAsImV4cCI6MjEwMzIzOTI4MH0.DpQmbwqeP0gUH4gb4_pwwIOBP1HcQWhg81LP-iwTdN8';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Supabase client instance initialized with project credentials.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Convert a Supabase Auth User object and optional database profile to AppUser
 */
export function mapSupabaseUserToAppUser(
  authUser: SupabaseAuthUser,
  profile?: Partial<AppUser> | null
): AppUser {
  const metadata = authUser.user_metadata || {};
  const email = authUser.email || profile?.email || '';
  const username = metadata.username || profile?.username || email.split('@')[0] || 'petugas';
  const role = (metadata.role || profile?.role || (email.includes('admin') || username === 'admin' ? 'admin' : 'staff')) as 'admin' | 'staff';
  const name = metadata.name || metadata.full_name || profile?.name || (role === 'admin' ? 'Ustadz Admin' : 'Petugas Perpustakaan');
  
  return {
    id: authUser.id,
    username,
    name,
    email,
    role,
    avatar: metadata.avatar_url || profile?.avatar || (
      role === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    ),
    phone: metadata.phone || profile?.phone || '',
    status: 'active',
    is_default: role === 'admin' && (username === 'admin' || email.startsWith('admin')),
    last_login: new Date().toISOString(),
    created_at: authUser.created_at || new Date().toISOString(),
  };
}

/**
 * Sign in using Supabase Auth with Email & Password
 * Accepts either Email or Username
 */
export async function signInWithSupabase(
  identifier: string,
  password: string
): Promise<{ success: boolean; message: string; user?: AppUser; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Kredensial Supabase belum dikonfigurasi.',
    };
  }

  const cleanId = identifier.trim();
  let emailToUse = cleanId;

  try {
    // If identifier is not an email, try looking up user profile in 'users' table or Supabase
    if (!cleanId.includes('@')) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('name', cleanId)
        .maybeSingle();

      if (userProfile?.email) {
        emailToUse = userProfile.email;
      } else {
        // Common pesantren email pattern fallback
        emailToUse = `${cleanId.toLowerCase()}@darululum.sch.id`;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });

    if (error) {
      let friendlyMessage = error.message;
      const lower = error.message.toLowerCase();

      if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
        friendlyMessage = 'Email/Username atau Kata sandi Supabase salah. Pastikan akun sudah dibuat di Supabase Auth.';
      } else if (lower.includes('email not confirmed')) {
        friendlyMessage = 'Email belum dikonfirmasi di Supabase. Silakan periksa kotak masuk email atau nonaktifkan "Confirm Email" di Supabase Auth Settings.';
      } else if (lower.includes('rate limit')) {
        friendlyMessage = 'Terlalu banyak percobaan login. Harap tunggu beberapa saat.';
      }

      return {
        success: false,
        message: friendlyMessage,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'Pengguna Supabase tidak ditemukan.',
      };
    }

    // Try fetching additional user profile data from users table if available
    let dbProfile: any = null;
    try {
      const { data: pData } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email || '')
        .maybeSingle();
      dbProfile = pData;
    } catch {
      // ignore table query error
    }

    const appUser = mapSupabaseUserToAppUser(data.user, dbProfile);

    // Save session info
    try {
      localStorage.setItem('perpustakaan_session_last_activity', Date.now().toString());
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `Login Supabase berhasil! Ahlan wa Sahlan, ${appUser.name}.`,
      user: appUser,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menghubungi layanan Supabase Auth.',
      error: String(err),
    };
  }
}

/**
 * Sign up a new user in Supabase Auth
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  profileData?: {
    name?: string;
    username?: string;
    role?: 'admin' | 'staff';
    phone?: string;
  }
): Promise<{ success: boolean; message: string; user?: AppUser; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Kredensial Supabase belum dikonfigurasi.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: profileData?.name || 'Petugas Perpustakaan',
          username: profileData?.username || email.split('@')[0],
          role: profileData?.role || 'staff',
          phone: profileData?.phone || '',
        },
      },
    });

    if (error) {
      return {
        success: false,
        message: `Gagal mendaftar di Supabase: ${error.message}`,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'Gagal membuat pengguna di Supabase.',
      };
    }

    // Also insert/upsert into public.users table if accessible
    try {
      await supabase.from('users').upsert({
        id: data.user.id,
        name: profileData?.name || 'Petugas Perpustakaan',
        email: email.trim().toLowerCase(),
        role: profileData?.role || 'staff',
      });
    } catch {
      // non-blocking
    }

    const appUser = mapSupabaseUserToAppUser(data.user);

    return {
      success: true,
      message: 'Pendaftaran pengguna Supabase berhasil! Silakan cek email jika verifikasi diaktifkan.',
      user: appUser,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal melakukan pendaftaran akun.',
      error: String(err),
    };
  }
}

/**
 * Sign out the currently active Supabase user session
 */
export async function signOutWithSupabase(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Logout lokal berhasil.' };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase signOut warning:', error.message);
    }
    return { success: true, message: 'Berhasil logout dari sesi Supabase.' };
  } catch (err: any) {
    return { success: true, message: 'Sesi pengguna berhasil diakhiri.' };
  }
}

/**
 * Get currently authenticated Supabase user and profile
 */
export async function getCurrentSupabaseUser(): Promise<AppUser | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    let dbProfile: any = null;
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email || '')
        .maybeSingle();
      dbProfile = data;
    } catch {
      // ignore
    }

    return mapSupabaseUserToAppUser(user, dbProfile);
  } catch {
    return null;
  }
}

/**
 * Request a Password Reset Email from Supabase
 */
export async function sendSupabasePasswordReset(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Kredensial Supabase belum dikonfigurasi.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });

    if (error) {
      return { success: false, message: `Gagal mengirim email reset: ${error.message}` };
    }

    return {
      success: true,
      message: 'Instruksi pemulihan kata sandi telah dikirim ke email Anda. Silakan cek inbox/spam.',
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal memproses reset kata sandi.' };
  }
}

/**
 * Subscribe to Supabase Auth State Changes (login, logout, token refresh)
 */
export function subscribeToSupabaseAuth(
  callback: (user: AppUser | null, event: string) => void
) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        let dbProfile: any = null;
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email || '')
            .maybeSingle();
          dbProfile = data;
        } catch {
          // ignore
        }
        const appUser = mapSupabaseUserToAppUser(session.user, dbProfile);
        callback(appUser, event);
      } else {
        callback(null, event);
      }
    }
  );

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}

/**
 * Check if the Supabase instance is reachable and tables are accessible
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tablesFound?: string[];
  error?: string;
}> {
  try {
    // Try querying the students table
    const { data, error } = await supabase.from('students').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist') || error.message.toLowerCase().includes('relation')) {
        return {
          connected: true,
          message: 'Terhubung ke proyek Supabase, namun tabel belum dibuat di database. Jalankan skrip SQL skema di Supabase SQL Editor.',
          error: error.message
        };
      }
      return {
        connected: false,
        message: `Gagal mengakses database: ${error.message}`,
        error: error.message
      };
    }

    return {
      connected: true,
      message: 'Koneksi ke Supabase berhasil dan tabel siap digunakan!',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Gagal menghubungi server Supabase',
      error: String(err)
    };
  }
}


