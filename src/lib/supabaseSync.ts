import { supabase, isSupabaseConfigured } from './supabase';
import { Student, RfidCard, LibraryVisit, Book, BookLoan, AppUser, LiteracyAward, BookWishlist, SantriMenu } from '../types';

// Table availability caches to prevent loud warnings when tables haven't been created yet in user's Supabase
let isWishlistTableAvailable: boolean | null = null;
let isAwardTableAvailable: boolean | null = null;
let isSantriMenuTableAvailable: boolean | null = null;

export function isSchemaCacheOrMissingTableError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error.message || error.details || error.hint || '');
  const code = error.code;
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('Could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

export function getWishlistTableAvailable(): boolean | null {
  return isWishlistTableAvailable;
}

export function setWishlistTableAvailable(val: boolean) {
  isWishlistTableAvailable = val;
}

export function getAwardTableAvailable(): boolean | null {
  return isAwardTableAvailable;
}

export function setAwardTableAvailable(val: boolean) {
  isAwardTableAvailable = val;
}

export function getSantriMenuTableAvailable(): boolean | null {
  return isSantriMenuTableAvailable;
}

export function setSantriMenuTableAvailable(val: boolean) {
  isSantriMenuTableAvailable = val;
}

export async function checkSupabaseTableAvailability(): Promise<{ wishlists: boolean; awards: boolean; santriMenus: boolean }> {
  if (!isSupabaseConfigured) {
    return { wishlists: false, awards: false, santriMenus: false };
  }
  try {
    const [wishRes, awardRes, menuRes] = await Promise.all([
      supabase.from('book_wishlists').select('id').limit(1),
      supabase.from('literacy_awards').select('id').limit(1),
      supabase.from('santri_menus').select('id').limit(1)
    ]);
    
    const wishOk = !wishRes.error || !isSchemaCacheOrMissingTableError(wishRes.error);
    const awardOk = !awardRes.error || !isSchemaCacheOrMissingTableError(awardRes.error);
    const menuOk = !menuRes.error || !isSchemaCacheOrMissingTableError(menuRes.error);
    
    isWishlistTableAvailable = wishOk;
    isAwardTableAvailable = awardOk;
    isSantriMenuTableAvailable = menuOk;
    
    return { wishlists: wishOk, awards: awardOk, santriMenus: menuOk };
  } catch {
    return { wishlists: false, awards: false, santriMenus: false };
  }
}

export interface SyncStats {
  studentsCount: number;
  booksCount: number;
  loansCount: number;
  visitsCount: number;
  cardsCount: number;
  awardsCount: number;
  wishlistsCount: number;
  lastSyncedAt: string;
}

/**
 * Upload and synchronize all local data to Supabase
 */
export async function syncAllToSupabase(data: {
  students: Student[];
  cards: RfidCard[];
  books: Book[];
  loans: BookLoan[];
  visits: LibraryVisit[];
  users: AppUser[];
  awards?: LiteracyAward[];
  wishlists?: BookWishlist[];
  santriMenus?: SantriMenu[];
}): Promise<{ success: boolean; message: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Kredensial Supabase belum dikonfigurasi.' };
  }

  try {
    // 1. Sync Students
    if (data.students.length > 0) {
      const studentPayloads = data.students.map(s => {
        const payload: any = {
          nis: s.nis,
          name: s.name,
          class: s.class,
          gender: s.gender,
          photo_url: s.photo_url || null,
          phone: s.phone || null,
          status: s.status || 'active',
        };
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id);
        if (isUUID) payload.id = s.id;
        return payload;
      });

      const { error: studentErr } = await supabase
        .from('students')
        .upsert(studentPayloads, { onConflict: 'nis' });
      if (studentErr) console.warn('Supabase students upsert warning:', studentErr);
    }

    // 2. Sync Books
    if (data.books.length > 0) {
      const bookPayloads = data.books.map(b => {
        const rackLoc = (b.rack_location || b.shelf_location || 'Rak A-01').trim();
        const bookYear = b.year ?? b.publish_year ?? null;
        const payload: any = {
          code: b.code.trim().toUpperCase(),
          title: b.title.trim(),
          author: b.author.trim(),
          publisher: b.publisher ? b.publisher.trim() : null,
          year: bookYear ? Number(bookYear) : null,
          category: b.category,
          rack_location: rackLoc,
          total_stock: Math.max(1, Number(b.total_stock) || 1),
          available_stock: Math.max(0, Number(b.available_stock) ?? (Number(b.total_stock) || 1)),
          cover_url: b.cover_url || null,
          isbn: b.isbn ? b.isbn.trim() : null,
        };
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id);
        if (isUUID) payload.id = b.id;
        return payload;
      });

      const { error: bookErr } = await supabase
        .from('books')
        .upsert(bookPayloads, { onConflict: 'code' });
      if (bookErr) console.warn('Supabase books upsert warning:', bookErr);
    }

    // 3. Sync RFID Cards
    if (data.cards.length > 0) {
      const cardPayloads = data.cards.map(c => {
        const payload: any = {
          uid: c.uid,
          status: c.status || 'active',
          note: c.note || null,
          registered_at: c.registered_at || new Date().toISOString(),
        };
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id);
        if (isUUID) payload.id = c.id;
        if (c.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.student_id)) {
          payload.student_id = c.student_id;
        }
        return payload;
      });

      const { error: cardErr } = await supabase
        .from('rfid_cards')
        .upsert(cardPayloads, { onConflict: 'uid' });
      if (cardErr) console.warn('Supabase cards upsert warning:', cardErr);
    }

    // 4. Sync Users (Petugas & Administrator)
    if (data.users && data.users.length > 0) {
      const userPayloads = data.users.map(u => ({
        name: u.name,
        email: u.email.toLowerCase(),
        role: u.role,
        avatar_url: u.avatar || null,
      })).filter(u => u.email);

      const { error: userErr } = await supabase
        .from('users')
        .upsert(userPayloads, { onConflict: 'email' });
      if (userErr) console.warn('Supabase users upsert warning:', userErr);
    }

    // 5. Sync Literacy Awards (Arsip Piagam Penghargaan)
    if (data.awards && data.awards.length > 0) {
      const awardPayloads = data.awards.map(a => {
        const payload: any = {
          title: a.title,
          period: a.period,
          category: a.category,
          certificate_no: a.certificate_no,
          reward_item: a.reward_item,
          awarded_at: a.awarded_at,
          notes: a.notes || null,
          student_name: a.student_name || null,
          student_nis: a.student_nis || null,
          student_class: a.student_class || null,
          student_photo_url: a.student_photo_url || null,
        };
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.id);
        if (isUUID) payload.id = a.id;
        if (a.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.student_id)) {
          payload.student_id = a.student_id;
        }
        return payload;
      });

      const { error: awardErr } = await supabase
        .from('literacy_awards')
        .upsert(awardPayloads, { onConflict: 'certificate_no' });
      if (awardErr) {
        if (isSchemaCacheOrMissingTableError(awardErr)) {
          isAwardTableAvailable = false;
          console.info('[Supabase Sync] Tabel public.literacy_awards belum dibuat di Supabase, sinkronisasi piagam dilewati sementara.');
        } else {
          console.warn('Supabase awards upsert warning:', awardErr);
        }
      } else {
        isAwardTableAvailable = true;
      }
    }

    // 8. Sync Book Wishlists
    if (data.wishlists && data.wishlists.length > 0) {
      const wishlistPayloads = data.wishlists.map(w => {
        const payload: any = {
          student_nis: w.student_nis || null,
          student_name: w.student_name,
          student_class: w.student_class || null,
          title: w.title,
          author: w.author,
          publisher: w.publisher || null,
          category: w.category || 'Kitab Kuning / Turats',
          reason: w.reason,
          urgency: w.urgency || 'sedang',
          estimated_volume: w.estimated_volume || null,
          status: w.status || 'pending',
          staff_notes: w.staff_notes || null,
          created_at: w.created_at,
          updated_at: w.updated_at || null,
        };
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(w.id)) {
          payload.id = w.id;
        }
        if (w.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(w.student_id)) {
          payload.student_id = w.student_id;
        }
        return payload;
      });

      const { error: wishErr } = await supabase
        .from('book_wishlists')
        .upsert(wishlistPayloads, { onConflict: 'id' });
      if (wishErr) {
        if (isSchemaCacheOrMissingTableError(wishErr)) {
          isWishlistTableAvailable = false;
          console.info('[Supabase Sync] Tabel public.book_wishlists belum dibuat di Supabase, sinkronisasi usulan buku dilewati sementara.');
        } else {
          console.warn('Supabase wishlists upsert warning:', wishErr);
        }
      } else {
        isWishlistTableAvailable = true;
      }
    }

    // 9. Sync Santri Menus Configuration
    if (data.santriMenus && data.santriMenus.length > 0) {
      const menuPayloads = data.santriMenus.map(m => {
        const payload: any = {
          menu_key: m.menu_key,
          menu_name: m.menu_name,
          description: m.description || null,
          is_enabled: m.is_enabled,
          icon: m.icon,
          route: m.route,
          sort_order: m.sort_order,
          category: m.category || 'utama',
          badge: m.badge || null,
          updated_at: new Date().toISOString(),
        };
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id)) {
          payload.id = m.id;
        }
        return payload;
      });

      const { error: menuErr } = await supabase
        .from('santri_menus')
        .upsert(menuPayloads, { onConflict: 'menu_key' });
      if (menuErr) {
        if (isSchemaCacheOrMissingTableError(menuErr)) {
          isSantriMenuTableAvailable = false;
          console.info('[Supabase Sync] Tabel public.santri_menus belum dibuat di Supabase.');
        } else {
          console.warn('Supabase santri_menus upsert warning:', menuErr);
        }
      } else {
        isSantriMenuTableAvailable = true;
      }
    }

    return {
      success: true,
      message: 'Semua data perpustakaan termasuk piagam penghargaan, usulan santri, pengaturan menu santri, dan akun pengguna berhasil disinkronkan ke database Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi: ${err?.message || err}`,
      error: String(err),
    };
  }
}

/**
 * Fetch latest data from Supabase tables
 */
export async function fetchAllFromSupabase(): Promise<{
  success: boolean;
  students?: Student[];
  books?: Book[];
  cards?: RfidCard[];
  visits?: LibraryVisit[];
  loans?: BookLoan[];
  users?: AppUser[];
  awards?: LiteracyAward[];
  wishlists?: BookWishlist[];
  santriMenus?: SantriMenu[];
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const [studentsRes, booksRes, cardsRes, visitsRes, loansRes, usersRes, awardsRes, wishlistsRes, santriMenusRes] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('rfid_cards').select('*'),
      supabase.from('library_visits').select('*').order('check_in', { ascending: false }).limit(250),
      supabase.from('book_loans').select('*').order('borrow_date', { ascending: false }).limit(250),
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('literacy_awards').select('*').order('awarded_at', { ascending: false }).limit(200),
      supabase.from('book_wishlists').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('santri_menus').select('*').order('sort_order', { ascending: true }),
    ]);

    const result: any = { success: true };

    let cardsList: RfidCard[] = [];
    if (cardsRes.data !== null && !cardsRes.error) {
      cardsList = cardsRes.data.map((row: any) => ({
        id: row.id,
        uid: row.uid,
        student_id: row.student_id,
        status: row.status,
        registered_at: row.registered_at,
        note: row.note || '',
      }));
    }

    if (studentsRes.data !== null && !studentsRes.error) {
      result.students = studentsRes.data.map((row: any) => {
        const studentCard = cardsList.find(c => c.student_id === row.id);
        return {
          id: row.id,
          nis: row.nis,
          name: row.name,
          class: row.class,
          gender: row.gender,
          photo_url: row.photo_url || '',
          phone: row.phone || '',
          status: row.status || 'active',
          rfid_uid: studentCard ? studentCard.uid : undefined,
          created_at: row.created_at,
        };
      });
    }

    if (booksRes.data !== null && !booksRes.error) {
      result.books = booksRes.data.map((row: any) => {
        const rackLoc = row.rack_location || 'Rak A-01';
        const bookYear = row.year ? Number(row.year) : undefined;
        return {
          id: row.id,
          code: row.code,
          title: row.title,
          author: row.author,
          publisher: row.publisher || '',
          year: bookYear,
          publish_year: bookYear,
          category: row.category || 'Kitab Kuning / Turats',
          rack_location: rackLoc,
          shelf_location: rackLoc,
          total_stock: Number(row.total_stock) || 1,
          available_stock: Number(row.available_stock) ?? 1,
          cover_url: row.cover_url || '',
          isbn: row.isbn || '',
          description: row.description || '',
          created_at: row.created_at,
        };
      });
    }

    // Ensure all student cards exist in cards list
    if (result.students) {
      result.students.forEach((s: Student) => {
        if (s.rfid_uid && !cardsList.some(c => c.uid === s.rfid_uid)) {
          cardsList.push({
            id: `c-${s.id}`,
            uid: s.rfid_uid,
            student_id: s.id,
            status: 'active',
            registered_at: s.created_at || new Date().toISOString(),
            note: `Kartu santri ${s.name} (${s.nis})`,
          });
        }
      });
    }
    result.cards = cardsList;

    if (visitsRes.data !== null && !visitsRes.error) {
      result.visits = visitsRes.data.map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        rfid_card_id: row.rfid_card_id,
        rfid_uid: row.rfid_uid,
        check_in: row.check_in,
        check_out: row.check_out,
        duration_minutes: row.duration_minutes,
        status: row.status,
        created_at: row.created_at,
        notes: row.notes || '',
      }));
    }

    if (loansRes.data !== null && !loansRes.error) {
      result.loans = loansRes.data.map((row: any) => ({
        id: row.id,
        loan_code: row.loan_code,
        student_id: row.student_id,
        book_id: row.book_id,
        borrow_date: row.borrow_date,
        due_date: row.due_date,
        return_date: row.return_date,
        status: row.status,
        fine_amount: Number(row.fine_amount) || 0,
        notes: row.notes || '',
        created_at: row.created_at,
      }));
    }

    if (usersRes.data !== null && !usersRes.error) {
      result.users = usersRes.data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        username: row.username || row.email?.split('@')[0] || 'petugas',
        role: row.role || 'staff',
        avatar: row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone: row.phone || '',
        status: row.status || 'active',
        is_default: row.role === 'admin' && (row.email?.startsWith('admin') || row.name?.toLowerCase().includes('admin')),
        created_at: row.created_at || new Date().toISOString(),
      }));
    }

    if (awardsRes.error) {
      if (isSchemaCacheOrMissingTableError(awardsRes.error)) {
        isAwardTableAvailable = false;
        console.info('[Supabase Sync] Tabel public.literacy_awards belum ada di database Supabase. Menggunakan data piagam lokal.');
      }
    } else if (awardsRes.data !== null) {
      isAwardTableAvailable = true;
      result.awards = awardsRes.data.map((row: any) => ({
        id: row.id,
        student_id: row.student_id || row.student_nis || 'std-archived',
        student_name: row.student_name || '',
        student_nis: row.student_nis || '',
        student_class: row.student_class || '',
        student_photo_url: row.student_photo_url || '',
        title: row.title,
        period: row.period,
        category: row.category || 'top_reader',
        certificate_no: row.certificate_no,
        reward_item: row.reward_item,
        awarded_at: row.awarded_at,
        notes: row.notes || '',
      }));
    }

    if (wishlistsRes.error) {
      if (isSchemaCacheOrMissingTableError(wishlistsRes.error)) {
        isWishlistTableAvailable = false;
        console.info('[Supabase Sync] Tabel public.book_wishlists belum ada di database Supabase. Menggunakan data usulan lokal.');
      }
    } else if (wishlistsRes.data !== null) {
      isWishlistTableAvailable = true;
      result.wishlists = wishlistsRes.data.map((row: any) => ({
        id: row.id,
        student_id: row.student_id || row.student_nis || 'std-santri',
        student_nis: row.student_nis || '',
        student_name: row.student_name || '',
        student_class: row.student_class || '',
        title: row.title,
        author: row.author,
        publisher: row.publisher || undefined,
        category: row.category || 'Kitab Kuning / Turats',
        reason: row.reason,
        urgency: row.urgency || 'sedang',
        estimated_volume: row.estimated_volume || undefined,
        status: row.status || 'pending',
        staff_notes: row.staff_notes || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at || undefined,
      }));
    }

    if (santriMenusRes.error) {
      if (isSchemaCacheOrMissingTableError(santriMenusRes.error)) {
        isSantriMenuTableAvailable = false;
      }
    } else if (santriMenusRes.data !== null && santriMenusRes.data.length > 0) {
      isSantriMenuTableAvailable = true;
      result.santriMenus = santriMenusRes.data.map((row: any) => ({
        id: row.id,
        menu_key: row.menu_key,
        menu_name: row.menu_name,
        description: row.description || '',
        is_enabled: Boolean(row.is_enabled),
        icon: row.icon || 'BookOpen',
        route: row.route,
        sort_order: row.sort_order ?? 1,
        category: row.category || 'utama',
        badge: row.badge,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * ============================================================================
 * DIRECT SUPABASE CRUD FUNCTIONS (IMMEDIATE CLOUD PERSISTENCE)
 * ============================================================================
 */

// --- STUDENT OPERATIONS ---
export async function insertStudentToSupabase(student: Student): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const payload: any = {
      nis: student.nis,
      name: student.name,
      class: student.class,
      gender: student.gender,
      photo_url: student.photo_url || null,
      phone: student.phone || null,
      status: student.status || 'active',
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.id)) {
      payload.id = student.id;
    }
    const { data, error } = await supabase.from('students').upsert(payload, { onConflict: 'nis' }).select('id').maybeSingle();
    if (error) {
      console.warn('Supabase upsert student notice:', error.message, error.details);
      return { success: false, error: error.message };
    }
    const studentDbId = data?.id || (payload.id ? payload.id : null);

    // If student has an RFID UID, also ensure it's registered in rfid_cards table
    if (student.rfid_uid) {
      const cardPayload: any = {
        uid: student.rfid_uid.trim().toUpperCase(),
        status: 'active',
        note: `Kartu santri ${student.name} (${student.nis})`,
        registered_at: new Date().toISOString(),
      };
      if (studentDbId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentDbId)) {
        cardPayload.student_id = studentDbId;
      }
      await supabase.from('rfid_cards').upsert(cardPayload, { onConflict: 'uid' });
    }

    return { success: true, id: studentDbId };
  } catch (e) {
    console.warn('Supabase insert student exception:', e);
    return { success: false };
  }
}

export async function updateStudentInSupabase(id: string, updates: Partial<Student>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.class !== undefined) payload.class = updates.class;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.photo_url !== undefined) payload.photo_url = updates.photo_url || null;
    if (updates.phone !== undefined) payload.phone = updates.phone || null;
    if (updates.status !== undefined) payload.status = updates.status;

    let query = supabase.from('students').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.nis) {
      query = query.eq('nis', updates.nis);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;

    // If rfid_uid changed in updates
    if (updates.rfid_uid) {
      const cleanUid = updates.rfid_uid.trim().toUpperCase();
      const cardPayload: any = {
        uid: cleanUid,
        status: 'active',
        registered_at: new Date().toISOString()
      };
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        cardPayload.student_id = id;
      }
      await supabase.from('rfid_cards').upsert(cardPayload, { onConflict: 'uid' });
    }

    return !error;
  } catch (e) {
    console.warn('Supabase update student exception:', e);
    return false;
  }
}

export async function deleteStudentFromSupabase(student: { id: string; nis?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('students').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.id)) {
      query = query.eq('id', student.id);
    } else if (student.nis) {
      query = query.eq('nis', student.nis);
    } else {
      query = query.eq('id', student.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete student exception:', e);
    return false;
  }
}

// --- BOOK OPERATIONS ---
export async function insertBookToSupabase(book: Book): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const rackLoc = (book.rack_location || book.shelf_location || 'Rak A-01').trim();
    const bookYear = book.year ?? book.publish_year ?? null;
    const payload: any = {
      code: book.code.trim().toUpperCase(),
      title: book.title.trim(),
      author: book.author.trim(),
      publisher: book.publisher ? book.publisher.trim() : null,
      year: bookYear ? Number(bookYear) : null,
      category: book.category || 'Kitab Kuning / Turats',
      rack_location: rackLoc,
      total_stock: Math.max(1, Number(book.total_stock) || 1),
      available_stock: Math.max(0, Number(book.available_stock) ?? (Number(book.total_stock) || 1)),
      cover_url: book.cover_url || null,
      isbn: book.isbn ? book.isbn.trim() : null,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id)) {
      payload.id = book.id;
    }
    const { data, error } = await supabase.from('books').upsert(payload, { onConflict: 'code' }).select('id').maybeSingle();
    if (error) {
      console.warn('Supabase upsert book notice:', error.message, error.details);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id || (payload.id ? payload.id : undefined) };
  } catch (e: any) {
    console.warn('Supabase insert book notice:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

export async function updateBookInSupabase(id: string, updates: Partial<Book>): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.author !== undefined) payload.author = updates.author.trim();
    if (updates.publisher !== undefined) payload.publisher = updates.publisher ? updates.publisher.trim() : null;
    if (updates.year !== undefined || updates.publish_year !== undefined) {
      const y = updates.year ?? updates.publish_year;
      payload.year = y ? Number(y) : null;
    }
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.rack_location !== undefined || updates.shelf_location !== undefined) {
      payload.rack_location = (updates.rack_location ?? updates.shelf_location)?.trim() || 'Rak A-01';
    }
    if (updates.total_stock !== undefined) payload.total_stock = Math.max(1, Number(updates.total_stock) || 1);
    if (updates.available_stock !== undefined) payload.available_stock = Math.max(0, Number(updates.available_stock) ?? 1);
    if (updates.cover_url !== undefined) payload.cover_url = updates.cover_url || null;
    if (updates.isbn !== undefined) payload.isbn = updates.isbn ? updates.isbn.trim() : null;
    if (updates.code !== undefined) payload.code = updates.code.trim().toUpperCase();

    let query = supabase.from('books').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.code) {
      query = query.eq('code', updates.code.trim().toUpperCase());
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;
    if (error) {
      console.warn('Supabase update book notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.warn('Supabase update book notice:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

export async function deleteBookFromSupabase(book: { id: string; code?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('books').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id)) {
      query = query.eq('id', book.id);
    } else if (book.code) {
      query = query.eq('code', book.code);
    } else {
      query = query.eq('id', book.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete book exception:', e);
    return false;
  }
}

// --- RFID CARD OPERATIONS ---
export async function insertCardToSupabase(card: RfidCard): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {
      uid: card.uid,
      status: card.status || 'active',
      note: card.note || null,
      registered_at: card.registered_at || new Date().toISOString(),
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.id)) {
      payload.id = card.id;
    }
    if (card.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.student_id)) {
      payload.student_id = card.student_id;
    }
    const { error } = await supabase.from('rfid_cards').upsert(payload, { onConflict: 'uid' });
    return !error;
  } catch (e) {
    console.warn('Supabase insert card exception:', e);
    return false;
  }
}

export async function updateCardInSupabase(id: string, updates: Partial<RfidCard>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.note !== undefined) payload.note = updates.note;
    if (updates.student_id !== undefined) {
      payload.student_id = updates.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updates.student_id)
        ? updates.student_id
        : null;
    }
    let query = supabase.from('rfid_cards').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.uid) {
      query = query.eq('uid', updates.uid);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase update card exception:', e);
    return false;
  }
}

export async function deleteCardFromSupabase(card: { id: string; uid?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('rfid_cards').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.id)) {
      query = query.eq('id', card.id);
    } else if (card.uid) {
      query = query.eq('uid', card.uid);
    } else {
      query = query.eq('id', card.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete card exception:', e);
    return false;
  }
}

// --- BOOK LOAN OPERATIONS ---
export async function insertLoanToSupabase(loan: BookLoan): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {
      loan_code: loan.loan_code,
      borrow_date: loan.borrow_date,
      due_date: loan.due_date,
      return_date: loan.return_date || null,
      status: loan.status,
      fine_amount: loan.fine_amount || 0,
      notes: loan.notes || null,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.id)) {
      payload.id = loan.id;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.student_id)) {
      payload.student_id = loan.student_id;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.book_id)) {
      payload.book_id = loan.book_id;
    }
    const { error } = await supabase.from('book_loans').upsert(payload, { onConflict: 'loan_code' });
    return !error;
  } catch (e) {
    console.warn('Supabase insert loan exception:', e);
    return false;
  }
}

export async function updateLoanInSupabase(id: string, updates: Partial<BookLoan>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.return_date !== undefined) payload.return_date = updates.return_date;
    if (updates.due_date !== undefined) payload.due_date = updates.due_date;
    if (updates.fine_amount !== undefined) payload.fine_amount = updates.fine_amount;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    let query = supabase.from('book_loans').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.loan_code) {
      query = query.eq('loan_code', updates.loan_code);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase update loan exception:', e);
    return false;
  }
}

export async function deleteLoanFromSupabase(loan: { id: string; loan_code?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('book_loans').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.id)) {
      query = query.eq('id', loan.id);
    } else if (loan.loan_code) {
      query = query.eq('loan_code', loan.loan_code);
    } else {
      query = query.eq('id', loan.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete loan exception:', e);
    return false;
  }
}

// --- VISIT OPERATIONS ---
export async function recordVisitToSupabase(visit: LibraryVisit): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Kredensial Supabase belum dikonfigurasi' };
  }

  // Fast-fail if browser explicitly reports offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'Koneksi jaringan terputus (Browser offline)' };
  }

  try {
    const payload: any = {
      rfid_uid: visit.rfid_uid,
      check_in: visit.check_in,
      check_out: visit.check_out || null,
      duration_minutes: visit.duration_minutes || null,
      status: visit.status,
      notes: visit.notes || null,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.id)) {
      payload.id = visit.id;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.student_id)) {
      payload.student_id = visit.student_id;
    }
    if (visit.rfid_card_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.rfid_card_id)) {
      payload.rfid_card_id = visit.rfid_card_id;
    }

    // 5-second timeout protection to avoid hanging if network socket is silently dead
    const queryPromise = supabase.from('library_visits').upsert(payload);
    const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi Supabase timeout (>5s)')), 5000)
    );

    const { error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

    if (error) {
      console.warn('Supabase record visit notice:', error.message || error);
      return { success: false, error: error.message || String(error) };
    }

    return { success: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn('Could not record visit to Supabase in background:', msg);
    return { success: false, error: msg };
  }
}

export async function updateVisitInSupabase(id: string, updates: Partial<LibraryVisit>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.check_out !== undefined) payload.check_out = updates.check_out;
    if (updates.duration_minutes !== undefined) payload.duration_minutes = updates.duration_minutes;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { error } = await supabase.from('library_visits').update(payload).eq('id', id);
    return !error;
  } catch (e) {
    console.warn('Supabase update visit exception:', e);
    return false;
  }
}

export async function deleteVisitFromSupabase(visitId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('library_visits').delete().eq('id', visitId);
    return !error;
  } catch (e) {
    console.warn('Supabase delete visit exception:', e);
    return false;
  }
}

// --- USER OPERATIONS ---
export async function fetchUsersFromSupabase(): Promise<AppUser[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username || row.email?.split('@')[0] || 'petugas',
      role: row.role || 'staff',
      avatar: row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone: row.phone || '',
      status: row.status || 'active',
      is_default: row.role === 'admin' && (row.email?.startsWith('admin') || row.name?.toLowerCase().includes('admin')),
      created_at: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Error fetching users from Supabase:', err);
    return [];
  }
}

export async function saveUserToSupabase(user: AppUser, _password?: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Disimpan secara lokal.' };
  }

  try {
    const payload: any = {
      name: user.name,
      email: user.email.toLowerCase(),
      role: user.role,
      avatar_url: user.avatar || null,
    };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (isUUID) {
      payload.id = user.id;
    }

    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'email' });

    if (error) {
      console.warn('Supabase save user warning:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Akun berhasil disimpan ke database Supabase.' };
  } catch (err: any) {
    console.warn('Supabase save user error:', err);
    return { success: false, message: err?.message || String(err) };
  }
}

export async function updateUserInSupabase(
  user: AppUser, 
  updates: Partial<AppUser>
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Diperbarui secara lokal.' };
  }

  try {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email.toLowerCase();
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;

    let query = supabase.from('users').update(payload);
    if (user.email) {
      query = query.eq('email', user.email.toLowerCase());
    } else {
      query = query.eq('id', user.id);
    }

    const { error } = await query;
    if (error) {
      console.warn('Supabase update user warning:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Akun berhasil diperbarui di database Supabase.' };
  } catch (err: any) {
    console.warn('Supabase update user error:', err);
    return { success: false, message: err?.message || String(err) };
  }
}

export async function deleteUserFromSupabase(user: AppUser): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Dihapus secara lokal.' };
  }

  try {
    let query = supabase.from('users').delete();
    if (user.email) {
      query = query.eq('email', user.email.toLowerCase());
    } else {
      query = query.eq('id', user.id);
    }

    const { error } = await query;
    if (error) {
      console.warn('Supabase delete user warning:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Akun berhasil dihapus dari database Supabase.' };
  } catch (err: any) {
    console.warn('Supabase delete user error:', err);
    return { success: false, message: err?.message || String(err) };
  }
}

// --- LITERACY AWARDS OPERATIONS ---
export async function insertAwardToSupabase(award: LiteracyAward): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  if (isAwardTableAvailable === false) return { success: true };
  try {
    const payload: any = {
      title: award.title,
      period: award.period,
      category: award.category,
      certificate_no: award.certificate_no,
      reward_item: award.reward_item,
      awarded_at: award.awarded_at,
      notes: award.notes || null,
      student_name: award.student_name || null,
      student_nis: award.student_nis || null,
      student_class: award.student_class || null,
      student_photo_url: award.student_photo_url || null,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(award.id)) {
      payload.id = award.id;
    }
    if (award.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(award.student_id)) {
      payload.student_id = award.student_id;
    }
    const { data, error } = await supabase.from('literacy_awards').upsert(payload, { onConflict: 'certificate_no' }).select('id').single();
    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isAwardTableAvailable = false;
        console.info('[Supabase Sync] Tabel public.literacy_awards belum ada di Supabase, data disimpan lokal.');
        return { success: true };
      }
      console.warn('Supabase insert award error:', error.message);
      return { success: false };
    }
    isAwardTableAvailable = true;
    return { success: true, id: data?.id };
  } catch (e: any) {
    if (isSchemaCacheOrMissingTableError(e)) {
      isAwardTableAvailable = false;
      return { success: true };
    }
    console.warn('Supabase insert award exception:', e);
    return { success: false };
  }
}

export async function updateAwardInSupabase(id: string, updates: Partial<LiteracyAward>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  if (isAwardTableAvailable === false) return true;
  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.period !== undefined) payload.period = updates.period;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.reward_item !== undefined) payload.reward_item = updates.reward_item;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.student_name !== undefined) payload.student_name = updates.student_name;
    if (updates.student_nis !== undefined) payload.student_nis = updates.student_nis;
    if (updates.student_class !== undefined) payload.student_class = updates.student_class;
    if (updates.student_photo_url !== undefined) payload.student_photo_url = updates.student_photo_url;

    let query = supabase.from('literacy_awards').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.certificate_no) {
      query = query.eq('certificate_no', updates.certificate_no);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;
    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isAwardTableAvailable = false;
        return true;
      }
      return false;
    }
    isAwardTableAvailable = true;
    return true;
  } catch (e: any) {
    if (isSchemaCacheOrMissingTableError(e)) {
      isAwardTableAvailable = false;
      return true;
    }
    console.warn('Supabase update award exception:', e);
    return false;
  }
}

export async function deleteAwardFromSupabase(award: { id: string; certificate_no?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  if (isAwardTableAvailable === false) return true;
  try {
    let query = supabase.from('literacy_awards').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(award.id)) {
      query = query.eq('id', award.id);
    } else if (award.certificate_no) {
      query = query.eq('certificate_no', award.certificate_no);
    } else {
      query = query.eq('id', award.id);
    }
    const { error } = await query;
    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isAwardTableAvailable = false;
        return true;
      }
      return false;
    }
    isAwardTableAvailable = true;
    return true;
  } catch (e: any) {
    if (isSchemaCacheOrMissingTableError(e)) {
      isAwardTableAvailable = false;
      return true;
    }
    console.warn('Supabase delete award exception:', e);
    return false;
  }
}

// --- BOOK WISHLISTS (USULAN BUKU & KITAB SANTRI) OPERATIONS ---
export async function fetchWishlistsFromSupabase(): Promise<BookWishlist[]> {
  if (!isSupabaseConfigured) return [];
  if (isWishlistTableAvailable === false) return [];
  try {
    const { data, error } = await supabase
      .from('book_wishlists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isWishlistTableAvailable = false;
        console.info('[Supabase Sync] Tabel public.book_wishlists belum ada di Supabase. Menggunakan usulan lokal.');
      }
      return [];
    }
    if (!data) return [];
    isWishlistTableAvailable = true;

    return data.map((row: any) => ({
      id: row.id,
      student_id: row.student_id || row.student_nis || 'std-santri',
      student_nis: row.student_nis || '',
      student_name: row.student_name || '',
      student_class: row.student_class || '',
      title: row.title,
      author: row.author,
      publisher: row.publisher || undefined,
      category: row.category || 'Kitab Kuning / Turats',
      reason: row.reason,
      urgency: row.urgency || 'sedang',
      estimated_volume: row.estimated_volume || undefined,
      status: row.status || 'pending',
      staff_notes: row.staff_notes || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at || undefined,
    }));
  } catch (err: any) {
    if (isSchemaCacheOrMissingTableError(err)) {
      isWishlistTableAvailable = false;
      return [];
    }
    console.warn('Supabase fetch wishlists error:', err);
    return [];
  }
}

export async function insertWishlistToSupabase(wishlist: BookWishlist): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  if (isWishlistTableAvailable === false) return { success: true };
  try {
    const payload: any = {
      student_nis: wishlist.student_nis || null,
      student_name: wishlist.student_name,
      student_class: wishlist.student_class || null,
      title: wishlist.title,
      author: wishlist.author,
      publisher: wishlist.publisher || null,
      category: wishlist.category || 'Kitab Kuning / Turats',
      reason: wishlist.reason,
      urgency: wishlist.urgency || 'sedang',
      estimated_volume: wishlist.estimated_volume || null,
      status: wishlist.status || 'pending',
      staff_notes: wishlist.staff_notes || null,
      created_at: wishlist.created_at || new Date().toISOString(),
      updated_at: wishlist.updated_at || null,
    };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wishlist.id);
    if (isUUID) {
      payload.id = wishlist.id;
    }
    if (wishlist.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wishlist.student_id)) {
      payload.student_id = wishlist.student_id;
    }

    const { data, error } = await supabase.from('book_wishlists').insert(payload).select('id').single();
    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isWishlistTableAvailable = false;
        console.info('[Supabase Sync] Tabel public.book_wishlists belum dibuat di Supabase. Usulan tersimpan di penyimpanan lokal.');
        return { success: true };
      }
      console.warn('Supabase insert wishlist error:', error.message);
      return { success: false, error: error.message };
    }
    isWishlistTableAvailable = true;
    return { success: true, id: data?.id };
  } catch (e: any) {
    if (isSchemaCacheOrMissingTableError(e)) {
      isWishlistTableAvailable = false;
      return { success: true };
    }
    console.warn('Supabase insert wishlist exception:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

export async function updateWishlistInSupabase(id: string, updates: Partial<BookWishlist>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  if (isWishlistTableAvailable === false) return true;
  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.publisher !== undefined) payload.publisher = updates.publisher;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.reason !== undefined) payload.reason = updates.reason;
    if (updates.urgency !== undefined) payload.urgency = updates.urgency;
    if (updates.estimated_volume !== undefined) payload.estimated_volume = updates.estimated_volume;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.staff_notes !== undefined) payload.staff_notes = updates.staff_notes;
    payload.updated_at = new Date().toISOString();

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      // If local ID is not UUID, return true as it is stored locally
      return true;
    }

    const { error } = await supabase.from('book_wishlists').update(payload).eq('id', id);
    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isWishlistTableAvailable = false;
        console.info('[Supabase Sync] Tabel public.book_wishlists belum dibuat di Supabase. Status usulan diperbarui di penyimpanan lokal.');
        return true;
      }
      console.warn('Supabase update wishlist error:', error.message);
      return false;
    }
    isWishlistTableAvailable = true;
    return true;
  } catch (e: any) {
    if (isSchemaCacheOrMissingTableError(e)) {
      isWishlistTableAvailable = false;
      return true;
    }
    console.warn('Supabase update wishlist exception:', e);
    return false;
  }
}

export async function deleteWishlistFromSupabase(wishlist: { id: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  if (isWishlistTableAvailable === false) return true;
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wishlist.id);
    if (!isUUID) return true;

    const { error } = await supabase.from('book_wishlists').delete().eq('id', wishlist.id);
    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isWishlistTableAvailable = false;
        return true;
      }
      console.warn('Supabase delete wishlist error:', error.message);
      return false;
    }
    isWishlistTableAvailable = true;
    return true;
  } catch (e: any) {
    if (isSchemaCacheOrMissingTableError(e)) {
      isWishlistTableAvailable = false;
      return true;
    }
    console.warn('Supabase delete wishlist exception:', e);
    return false;
  }
}

/**
 * ============================================================================
 * SUPABASE REALTIME SUBSCRIPTION & INSTANT BROADCAST SYSTEM
 * ============================================================================
 * Enables instant, zero-delay real-time synchronization like WhatsApp / Telegram.
 * Combines:
 * 1. Supabase Realtime Broadcast (WebSockets < 50ms across all devices)
 * 2. Supabase Postgres CDC (postgres_changes across public tables)
 * 3. Browser BroadcastChannel API (0ms across tabs in same browser)
 */

export const CLIENT_INSTANCE_ID = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : 'client_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();

export type RealtimeBroadcastType =
  | 'STUDENT_CHANGE'
  | 'BOOK_CHANGE'
  | 'CARD_CHANGE'
  | 'VISIT_CHANGE'
  | 'LOAN_CHANGE'
  | 'USER_CHANGE'
  | 'AWARD_CHANGE'
  | 'WISHLIST_CHANGE'
  | 'SANTRI_MENU_CHANGE'
  | 'FORCE_SYNC';

export interface RealtimeBroadcastPayload {
  type: RealtimeBroadcastType;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'REFRESH';
  payload: any;
  oldPayload?: any;
  senderId?: string;
  timestamp?: number;
}

let localBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localBroadcastChannel = new BroadcastChannel('library_tap_realtime_bus');
  }
} catch {
  // Graceful fallback if unsupported
}

let activeRealtimeChannel: any = null;

/**
 * Broadcasts an event to all other connected devices & tabs instantly
 */
export function broadcastRealtimeAction(data: RealtimeBroadcastPayload) {
  const message: RealtimeBroadcastPayload = {
    ...data,
    senderId: data.senderId || CLIENT_INSTANCE_ID,
    timestamp: data.timestamp || Date.now(),
  };

  // 1. Cross-tab instant propagation (0ms)
  try {
    localBroadcastChannel?.postMessage(message);
  } catch (err) {
    console.debug('Cross-tab broadcast notice:', err);
  }

  // 2. Supabase Realtime WebSocket broadcast (<50ms across devices)
  if (isSupabaseConfigured && activeRealtimeChannel) {
    try {
      activeRealtimeChannel.send({
        type: 'broadcast',
        event: 'realtime_event',
        payload: message,
      }).catch((err: any) => console.debug('Supabase broadcast send notice:', err));
    } catch (err) {
      console.debug('Supabase realtime channel send notice:', err);
    }
  }
}

export interface RealtimeHandlers {
  onStudentChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onBookChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onCardChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onVisitChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onLoanChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onUserChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onAwardChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onWishlistChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onSantriMenuChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR') => void;
  onForceSync?: () => void;
}

export function subscribeToAllDatabaseChanges(handlers: RealtimeHandlers): { unsubscribe: () => void } {
  // Handle cross-tab local broadcast messages
  const handleIncomingBroadcast = (data: RealtimeBroadcastPayload) => {
    if (!data || data.senderId === CLIENT_INSTANCE_ID) return;

    switch (data.type) {
      case 'STUDENT_CHANGE':
        handlers.onStudentChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'BOOK_CHANGE':
        handlers.onBookChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'CARD_CHANGE':
        handlers.onCardChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'VISIT_CHANGE':
        handlers.onVisitChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'LOAN_CHANGE':
        handlers.onLoanChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'USER_CHANGE':
        handlers.onUserChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'AWARD_CHANGE':
        if (handlers.onAwardChange) handlers.onAwardChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'WISHLIST_CHANGE':
        if (handlers.onWishlistChange) handlers.onWishlistChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'SANTRI_MENU_CHANGE':
        if (handlers.onSantriMenuChange) handlers.onSantriMenuChange(data.action as any, data.payload, data.oldPayload);
        break;
      case 'FORCE_SYNC':
        if (handlers.onForceSync) handlers.onForceSync();
        break;
    }
  };

  if (localBroadcastChannel) {
    localBroadcastChannel.onmessage = (event) => {
      handleIncomingBroadcast(event.data);
    };
  }

  if (!isSupabaseConfigured) {
    if (handlers.onStatusChange) handlers.onStatusChange('CONNECTED');
    return {
      unsubscribe: () => {
        if (localBroadcastChannel) localBroadcastChannel.onmessage = null;
      },
    };
  }

  // Create persistent Supabase Realtime Channel
  const channel = supabase
    .channel('public:library-database-sync', {
      config: {
        broadcast: { self: false },
      },
    })
    // 1. Instant WebSocket peer broadcast channel
    .on(
      'broadcast',
      { event: 'realtime_event' },
      (payload) => {
        if (payload?.payload) {
          handleIncomingBroadcast(payload.payload);
        }
      }
    )
    // 2. Postgres Change Data Capture (CDC) triggers
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      (payload) => {
        handlers.onStudentChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'books' },
      (payload) => {
        handlers.onBookChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rfid_cards' },
      (payload) => {
        handlers.onCardChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'library_visits' },
      (payload) => {
        handlers.onVisitChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'book_loans' },
      (payload) => {
        handlers.onLoanChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      (payload) => {
        handlers.onUserChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'literacy_awards' },
      (payload) => {
        if (handlers.onAwardChange) {
          handlers.onAwardChange(payload.eventType as any, payload.new, payload.old);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'book_wishlists' },
      (payload) => {
        if (handlers.onWishlistChange) {
          handlers.onWishlistChange(payload.eventType as any, payload.new, payload.old);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'santri_menus' },
      (payload) => {
        if (handlers.onSantriMenuChange) {
          handlers.onSantriMenuChange(payload.eventType as any, payload.new, payload.old);
        }
      }
    )
    .subscribe((status) => {
      if (handlers.onStatusChange) {
        if (status === 'SUBSCRIBED') {
          handlers.onStatusChange('CONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          handlers.onStatusChange('ERROR');
        } else if (status === 'CLOSED') {
          handlers.onStatusChange('DISCONNECTED');
        } else {
          handlers.onStatusChange('CONNECTING');
        }
      }
    });

  activeRealtimeChannel = channel;

  // Auto-resync when device regains network or browser tab becomes visible
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && handlers.onForceSync) {
      handlers.onForceSync();
    }
  };

  const handleOnline = () => {
    if (handlers.onForceSync) {
      handlers.onForceSync();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
  }

  return {
    unsubscribe: () => {
      if (localBroadcastChannel) localBroadcastChannel.onmessage = null;
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
      }
      activeRealtimeChannel = null;
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Clear all library records from Supabase tables
 */
export async function clearAllDataFromSupabase(includeUsers: boolean = false): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Supabase belum dikonfigurasi.' };
  }

  try {
    // Delete in sequence respecting foreign key constraints:
    // 1. book_loans (depends on students & books)
    const { error: loanErr } = await supabase
      .from('book_loans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (loanErr) console.warn('Supabase delete loans warning:', loanErr);

    // 2. library_visits (depends on students & rfid_cards)
    const { error: visitErr } = await supabase
      .from('library_visits')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (visitErr) console.warn('Supabase delete visits warning:', visitErr);

    // 3. literacy_awards (depends on students)
    const { error: awardErr } = await supabase
      .from('literacy_awards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (awardErr) console.warn('Supabase delete awards warning:', awardErr);

    // 4. book_wishlists (depends on students)
    const { error: wishErr } = await supabase
      .from('book_wishlists')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (wishErr) console.warn('Supabase delete wishlists warning:', wishErr);

    // 5. rfid_cards (depends on students)
    const { error: cardErr } = await supabase
      .from('rfid_cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (cardErr) console.warn('Supabase delete cards warning:', cardErr);

    // 6. books
    const { error: bookErr } = await supabase
      .from('books')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (bookErr) console.warn('Supabase delete books warning:', bookErr);

    // 7. students
    const { error: studentErr } = await supabase
      .from('students')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (studentErr) console.warn('Supabase delete students warning:', studentErr);

    if (includeUsers) {
      // Keep admin account safe if any
      const { error: userErr } = await supabase
        .from('users')
        .delete()
        .neq('role', 'admin');
      if (userErr) console.warn('Supabase delete users warning:', userErr);
    }

    return { success: true, message: 'Seluruh data di Supabase telah berhasil dikosongkan.' };
  } catch (err: any) {
    console.warn('Gagal mengosongkan data di Supabase:', err);
    return { success: false, message: err?.message || 'Gagal mengosongkan data di Supabase.' };
  }
}

// --- SANTRI MENUS OPERATIONS ---
export async function fetchSantriMenusFromSupabase(): Promise<{ success: boolean; data?: SantriMenu[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase belum dikonfigurasi' };
  }
  try {
    const { data, error } = await supabase
      .from('santri_menus')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isSantriMenuTableAvailable = false;
        return { success: false, error: 'Tabel santri_menus belum dibuat di Supabase.' };
      }
      return { success: false, error: error.message };
    }

    isSantriMenuTableAvailable = true;
    const mapped: SantriMenu[] = (data || []).map((row: any) => ({
      id: row.id,
      menu_key: row.menu_key,
      menu_name: row.menu_name,
      description: row.description || '',
      is_enabled: Boolean(row.is_enabled),
      icon: row.icon || 'BookOpen',
      route: row.route,
      sort_order: row.sort_order ?? 1,
      category: row.category || 'utama',
      badge: row.badge,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return { success: true, data: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function upsertSantriMenuInSupabase(menu: SantriMenu): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const payload: any = {
      menu_key: menu.menu_key,
      menu_name: menu.menu_name,
      description: menu.description || null,
      is_enabled: menu.is_enabled,
      icon: menu.icon,
      route: menu.route,
      sort_order: menu.sort_order,
      category: menu.category || 'utama',
      badge: menu.badge || null,
      updated_at: new Date().toISOString()
    };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(menu.id);
    if (isUUID) {
      payload.id = menu.id;
    }

    const { error } = await supabase
      .from('santri_menus')
      .upsert(payload, { onConflict: 'menu_key' });

    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isSantriMenuTableAvailable = false;
      }
      console.warn('Supabase upsert santri_menu warning:', error);
      return { success: false, error: error.message };
    }

    isSantriMenuTableAvailable = true;
    return { success: true };
  } catch (e: any) {
    console.warn('Supabase upsert santri_menu exception:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

export async function batchSaveSantriMenusToSupabase(menus: SantriMenu[]): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || menus.length === 0) return { success: true };
  try {
    const payloads = menus.map(m => {
      const p: any = {
        menu_key: m.menu_key,
        menu_name: m.menu_name,
        description: m.description || null,
        is_enabled: m.is_enabled,
        icon: m.icon,
        route: m.route,
        sort_order: m.sort_order,
        category: m.category || 'utama',
        badge: m.badge || null,
        updated_at: new Date().toISOString()
      };
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id)) {
        p.id = m.id;
      }
      return p;
    });

    const { error } = await supabase
      .from('santri_menus')
      .upsert(payloads, { onConflict: 'menu_key' });

    if (error) {
      if (isSchemaCacheOrMissingTableError(error)) {
        isSantriMenuTableAvailable = false;
      }
      console.warn('Supabase batch upsert santri_menus warning:', error);
      return { success: false, error: error.message };
    }

    isSantriMenuTableAvailable = true;
    return { success: true };
  } catch (e: any) {
    console.warn('Supabase batch upsert santri_menus exception:', e);
    return { success: false, error: e?.message || String(e) };
  }
}

