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
  GraduationCap
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

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
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) {
      setErrorMessage('Silakan masukkan Username atau Email Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Kata Sandi (Password).');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Simulate minor network auth latency for smooth realistic UX
      await new Promise(r => setTimeout(r, 450));
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
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v2.5
              </span>
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
                Silakan masuk dengan akun Administrator atau Petugas Perpustakaan yang telah terdaftar.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Username atau Email
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
                    placeholder="Contoh: admin atau nama@darululum.sch.id"
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
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Bantuan Akun
                  </button>
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
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
            Sistem Informasi Perpustakaan & Presensi Tap RFID • Pesantren
          </div>
        </div>

        {/* Right Column: Quick Demo Accounts & System Info */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Quick Access Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Akun Demo Cepat
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

          {/* System Capability Highlight */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Fitur Multi-User & Keamanan
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Administrator Bawaan</strong> dapat membuat akun baru untuk ustadz/ustadzah staf lainnya.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pemisahan wewenang hak akses (Admin vs Staff Operasional).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Proteksi akun utama & pelacakan waktu login terakhir.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help / Password Reset Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-200 space-y-4">
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
                Aplikasi ini dilengkapi dengan <strong>1 Akun Administrator Utama Bawaan</strong>:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
                <div>Username: <strong className="text-amber-300">admin</strong></div>
                <div>Password: <strong className="text-amber-300">admin123</strong></div>
              </div>
              <p>
                Jika Anda lupa kata sandi akun staf lainnya atau ingin menambahkan akun ustadz/ustadzah baru:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Masuk menggunakan akun <strong>admin</strong>.</li>
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
