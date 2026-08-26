import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Sparkles, 
  Tv, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  HelpCircle,
  Library,
  GraduationCap,
  Cloud,
  Mail,
  UserPlus
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { isSupabaseConfigured, sendSupabasePasswordReset, signUpWithSupabase } from '../../lib/supabase';

interface LoginPageProps {
  onOpenKiosk?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenKiosk }) => {
  const { login, settings, users } = useLibrary();
  
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [sessionTimeoutNotice, setSessionTimeoutNotice] = useState<string | null>(() => {
    try {
      const reason = localStorage.getItem('perpustakaan_session_logout_reason');
      if (reason) {
        localStorage.removeItem('perpustakaan_session_logout_reason');
        return reason;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);

  // Register modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'staff'>('staff');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regResult, setRegResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) {
      setErrorMessage('Silakan masukkan Username atau Email Supabase Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Kata Sandi (Password).');
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      const res = await login(identity, password);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memproses login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoUsername: string, demoPass: string) => {
    setIdentity(demoUsername);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetResult({ success: false, message: 'Masukkan alamat email yang valid.' });
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      const res = await sendSupabasePasswordReset(resetEmail);
      setResetResult(res);
      if (res.success) {
        setSuccessNotice('Tautan reset kata sandi telah dikirimkan ke email Anda.');
      }
    } catch (err: any) {
      setResetResult({ success: false, message: err?.message || 'Gagal mengirim email reset.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegResult({ success: false, message: 'Harap lengkapi semua kolom pendaftaran.' });
      return;
    }

    setIsRegistering(true);
    setRegResult(null);

    try {
      const res = await signUpWithSupabase(regEmail, regPassword, {
        name: regName,
        username: regEmail.split('@')[0],
        role: regRole,
      });

      setRegResult(res);
      if (res.success) {
        setIdentity(regEmail);
        setPassword(regPassword);
        setSuccessNotice('Akun Supabase berhasil dibuat! Anda dapat langsung masuk.');
        setTimeout(() => {
          setShowRegisterModal(false);
        }, 1200);
      }
    } catch (err: any) {
      setRegResult({ success: false, message: err?.message || 'Gagal membuat akun Supabase.' });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Decorative Islamic Geometry & Glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-lg shadow-emerald-900/40">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {settings.library_name || 'Perpustakaan Baitul Hikmah'}
              {isSupabaseConfigured && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Supabase Auth
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              {settings.institution_name || 'Pondok Pesantren Darul Ulum Modern'}
            </p>
          </div>
        </div>

        {onOpenKiosk && (
          <button
            id="btn-login-open-kiosk"
            onClick={onOpenKiosk}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 hover:text-emerald-200 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-xs font-medium backdrop-blur-sm shadow-sm"
          >
            <Tv className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Mode Kios Display TV</span>
            <span className="sm:hidden">Display TV</span>
          </button>
        )}
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 relative flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                Autentikasi Petugas Perpustakaan
              </span>
              <h2 className="text-2xl font-bold text-white">
                Masuk ke Sistem
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan akun email Supabase atau akun terdaftar untuk mengakses panel perpustakaan.
              </p>
            </div>

            {sessionTimeoutNotice && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-start justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-300">Sesi Berakhir (Idle Timeout)</span>
                    <span className="leading-relaxed text-amber-200/90">{sessionTimeoutNotice}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSessionTimeoutNotice(null)}
                  className="text-amber-400 hover:text-amber-200 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {successNotice && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successNotice}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email atau Username Supabase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="Contoh: ustadz@darululum.sch.id atau admin"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-sm outline-none transition-all"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Kata Sandi (Password)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setResetResult(null);
                        setResetEmail(identity.includes('@') ? identity : '');
                        setShowResetModal(true);
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      Lupa Password?
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Bantuan
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-sm outline-none transition-all"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    title={showPassword ? 'Sembunyikan' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs text-slate-400">Ingat sesi di perangkat ini</span>
                </label>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {isSupabaseConfigured && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRegResult(null);
                      setShowRegisterModal(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1.5 hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Daftar Akun Petugas Baru via Supabase
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <span>Sistem Informasi Perpustakaan & Presensi Tap RFID • Pesantren</span>
          </div>
        </div>

        {/* Right Column: Quick Demo Accounts & System Info */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Quick Access Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Akun Cepat / Akses Instan
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                1-Klik Isi
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Klik salah satu akun di bawah untuk mengisi formulir login secara otomatis:
            </p>

            <div className="space-y-2.5">
              {/* Master Admin Card */}
              <button
                id="btn-quick-admin-login"
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="w-full text-left p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-800/80 hover:from-amber-950/70 hover:to-slate-800 border border-amber-500/30 hover:border-amber-500/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      👑 Admin Utama
                    </span>
                    <span className="text-xs font-semibold text-white group-hover:text-amber-200">
                      Ustadz Abdullah
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-mono">admin</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pass: <code className="text-amber-300 bg-amber-950/60 px-1 rounded">admin123</code></span>
                  <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">Isi Akun →</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  ★ Hak Akses: Kelola Akun, Pengaturan, Sirkulasi, Presensi
                </div>
              </button>

              {/* Staff Card */}
              <button
                id="btn-quick-staff-login"
                type="button"
                onClick={() => handleQuickLogin('fatimah', 'staff123')}
                className="w-full text-left p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-800/80 hover:from-emerald-950/70 hover:to-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      👤 Staff Petugas
                    </span>
                    <span className="text-xs font-semibold text-white group-hover:text-emerald-200">
                      Ustadzah Fatimah
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">fatimah</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pass: <code className="text-emerald-300 bg-emerald-950/60 px-1 rounded">staff123</code></span>
                  <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">Isi Akun →</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  ★ Hak Akses: Presensi Tap RFID, Sirkulasi Pinjam/Kembali, Data Santri
                </div>
              </button>
            </div>
          </div>

          {/* Supabase & Security Info */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Supabase Cloud Authentication
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Terhubung ke Supabase Auth dengan enkripsi JWT aman & pemulihan kata sandi via email.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pemisahan hak akses otomatis (Admin vs Petugas Perpustakaan).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Sesi persisten otomatis dengan perpanjangan token berkala.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div 
          onClick={() => setShowRegisterModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <UserPlus className="w-5 h-5" />
                Daftar Akun Supabase Baru
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {regResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                regResult.success
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
              }`}>
                {regResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{regResult.message}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Ustadz Ahmad Fauzi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Alamat Email (Supabase Auth)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ahmad@darululum.sch.id"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Peran / Hak Akses
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as 'admin' | 'staff')}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="staff">Petugas Perpustakaan (Staff Operasional)</option>
                  <option value="admin">Administrator (Hak Akses Penuh)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  {isRegistering ? 'Memproses...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div 
          onClick={() => setShowResetModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                <Mail className="w-5 h-5" />
                Reset Kata Sandi via Email
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-white text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Masukkan alamat email akun Supabase Anda. Kami akan mengirimkan tautan pemulihan kata sandi.
            </p>

            {resetResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                resetResult.success
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
              }`}>
                {resetResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{resetResult.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nama@darululum.sch.id"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  {isResetting ? 'Mengirim...' : 'Kirim Email Pemulihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help / Password Reset Modal */}
      {showHelpModal && (
        <div 
          onClick={() => setShowHelpModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                Bantuan & Akses Akun
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                Aplikasi ini mendukung autentikasi <strong>Cloud Supabase</strong> serta <strong>Akun Administrator Utama</strong>:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
                <div>Username: <strong className="text-amber-300">admin</strong></div>
                <div>Password: <strong className="text-amber-300">admin123</strong></div>
              </div>
              <p>
                Jika Anda lupa kata sandi akun staf lainnya atau ingin menambahkan akun ustadz/ustadzah baru:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Masuk menggunakan akun <strong>admin</strong> atau akun Supabase Anda.</li>
                <li>Buka menu <strong>"Kelola Pengguna"</strong> di navigasi samping.</li>
                <li>Pilih <strong>"Ubah Password"</strong> atau buat akun baru sesuai kebutuhan.</li>
              </ol>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

