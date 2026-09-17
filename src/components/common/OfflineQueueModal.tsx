import React from 'react';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Trash2, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  Database,
  CloudOff
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { QueuedRfidTap } from '../../lib/offlineRfidQueue';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    offlineQueue,
    offlineQueueCount,
    isProcessingOfflineQueue,
    isOnline,
    flushOfflineQueue,
    clearOfflineQueue,
    removeQueuedTap
  } = useLibrary();

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    await flushOfflineQueue();
  };

  const handleClearAll = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua antrean tap RFID offline ini? Data yang belum tersinkronisasi ke cloud akan hilang.')) {
      clearOfflineQueue();
    }
  };

  const formatQueueTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              !isOnline 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                : offlineQueueCount > 0 
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {!isOnline ? <WifiOff className="w-5 h-5" /> : <Database className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Antrean Tap RFID Offline
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  !isOnline
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Penyimpanan lokal sementara (localStorage) saat koneksi Supabase terputus.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Status summary banner */}
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            offlineQueueCount > 0 
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200' 
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {offlineQueueCount > 0 ? (
                <CloudOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {offlineQueueCount > 0 
                    ? `${offlineQueueCount} presensi tersimpan dalam memori lokal` 
                    : 'Seluruh presensi RFID telah tersinkronisasi sempurna'}
                </p>
                <p className="text-[11px] opacity-85 mt-0.5">
                  {offlineQueueCount > 0 
                    ? 'Data otomatis dikirimkan ke cloud begitu koneksi internet aktif kembali.'
                    : 'Tidak ada data presensi yang tertahan di antrean offline.'}
                </p>
              </div>
            </div>

            {offlineQueueCount > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={isProcessingOfflineQueue || !isOnline}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all shrink-0 ${
                  isProcessingOfflineQueue || !isOnline
                    ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingOfflineQueue ? 'animate-spin' : ''}`} />
                <span>{isProcessingOfflineQueue ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
              </button>
            )}
          </div>

          {/* List of items */}
          {offlineQueueCount === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Antrean Bersih
              </p>
              <p className="text-xs mt-1">
                Semua tap RFID santri sudah masuk ke database Supabase Cloud.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {offlineQueue.map((item: QueuedRfidTap) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.action === 'INSERT'
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.action === 'INSERT' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.student_name || 'Santri'}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.action === 'INSERT'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {item.action === 'INSERT' ? 'Masuk' : 'Keluar'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.student_class && <span>Kelas {item.student_class}</span>}
                        {item.student_nis && <span>• NIS: {item.student_nis}</span>}
                        <span className="font-mono text-[10px]">UID: {item.rfid_uid}</span>
                      </div>

                      {item.lastError && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-mono">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.lastError}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatQueueTime(item.timestamp)}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        item.status === 'syncing'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 animate-pulse'
                          : item.status === 'failed'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {item.status === 'syncing' ? 'Mengirim...' : item.status === 'failed' ? `Gagal (${item.retryCount}x)` : 'Menunggu'}
                      </span>
                    </div>

                    <button
                      onClick={() => removeQueuedTap(item.id)}
                      title="Hapus dari antrean"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            {offlineQueueCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Antrean</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            {offlineQueueCount > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={isProcessingOfflineQueue || !isOnline}
                className={`px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                  isProcessingOfflineQueue || !isOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingOfflineQueue ? 'animate-spin' : ''}`} />
                <span>{isProcessingOfflineQueue ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
