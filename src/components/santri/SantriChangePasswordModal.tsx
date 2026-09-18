import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

interface SantriChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLogin?: boolean;
  studentNis?: string;
  studentName?: string;
  onSuccess?: () => void;
}

export const SantriChangePasswordModal: React.FC<SantriChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isFirstLogin = false,
  studentNis = '',
  studentName = '',
  onSuccess
}) => {
  const { currentUser, changeSantriPassword } = useLibrary();

  const [oldPassword, setOldPassword] = useState(isFirstLogin ? 'akunsantri' : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetId = currentUser?.id || studentNis;
  const displayName = studentName || currentUser?.name || 'Santri';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isFirstLogin && !oldPassword.trim()) {
      setErrorMsg('Masukkan kata sandi lama / kata sandi saat ini.');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg('Kata sandi baru tidak boleh kosong.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Kata sandi baru minimal 4 karakter.');
      return;
    }

    if (newPassword.toLowerCase() === 'akunsantri') {
      setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi bawaan ("akunsantri"). Silakan buat kata sandi unik pribadi Anda.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok. Periksa kembali.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = changeSantriPassword(
        targetId,
        newPassword.trim(),
        isFirstLogin ? undefined : oldPassword.trim()
      );

      if (res.success) {
        setSuccessMsg('Alhamdulillah! Kata sandi baru Anda berhasil disimpan.');
        setTimeout(() => {
          setIsSubmitting(false);
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengubah kata sandi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={isFirstLogin ? undefined : onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-white relative overflow-hidden animate-scale-up"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {isFirstLogin ? 'Ganti Password Pertama Kali' : 'Ubah Kata Sandi Akun'}
                {isFirstLogin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                    Wajib
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Akun Santri: <span className="text-emerald-400 font-semibold">{displayName}</span>
              </p>
            </div>
          </div>

          {!isFirstLogin && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Notice Info Banner */}
        {isFirstLogin ? (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Selamat Datang di Portal Santri!</span>
            </div>
            <p className="text-[11px] text-amber-200/90">
              Akun Anda baru pertama kali login menggunakan kata sandi bawaan (<code className="bg-amber-950/80 px-1 py-0.5 rounded font-mono text-amber-300">akunsantri</code>).
              Demi keamanan data pinjaman dan lencana prestasi membaca Anda, <strong>buat kata sandi baru pribadi Anda</strong> sekarang sebelum melanjutkan.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Gunakan kata sandi yang mudah Anda ingat namun sulit ditebak oleh santri lain. Minimal 4 karakter.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Password Lama (hanya jika bukan login pertama) */}
          {!isFirstLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi Lama / Saat Ini
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama atau 'akunsantri'..."
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-xs outline-none transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Password Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kata Sandi Baru Pribadi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Contoh: santrihebat2026"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-xs outline-none transition-all font-mono"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Minimal 4 karakter. Jangan gunakan lagi kata sandi bawaan "akunsantri".
            </p>
          </div>

          {/* Konfirmasi Password Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru Anda..."
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-xs outline-none transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {!isFirstLogin && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : isFirstLogin ? 'Simpan & Buka Portal' : 'Simpan Kata Sandi'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
