import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Clock, 
  Volume2, 
  VolumeX, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  Layers, 
  ShieldCheck,
  ShieldAlert,
  Lock,
  Timer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Moon,
  Sun,
  Palette,
  MessageSquare,
  Send,
  ExternalLink,
  Wifi,
  RefreshCw,
  Globe,
  Key,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  X,
  Cloud,
  Smartphone,
  Sliders,
  WifiOff
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { WhatsAppManagerModal } from './WhatsAppManagerModal';
import { OfflineQueueModal } from '../common/OfflineQueueModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { PWAInstallModal } from '../common/PWAInstallModal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { testSupabaseConnection, SUPABASE_URL, isSupabaseConfigured } from '../../lib/supabase';
import { 
  TestConnectionResult, 
  DEFAULT_LIVE_WA_GATEWAY_URL, 
  DEFAULT_LIVE_WA_API_KEY, 
  createWhatsAppDirectLink 
} from '../../utils/whatsappUtils';

export const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    toggleDarkMode,
    isDarkMode,
    resetToDefaultData, 
    clearAllData,
    supabaseSchema, 
    students, 
    cards, 
    visits,
    books,
    loans,
    awards,
    whatsappLogs,
    openWhatsAppModal,
    triggerScheduleCheckNow,
    sendCustomWhatsAppReminder,
    testWhatsAppConnection,
    isSupabaseSyncing,
    lastRealtimeSync,
    syncWithSupabase,
    pullFromSupabase,
    offlineQueue,
    offlineQueueCount,
    isProcessingOfflineQueue,
    isOnline,
    flushOfflineQueue
  } = useLibrary();

  const [showOfflineQueueModal, setShowOfflineQueueModal] = useState(false);
  const [showPwaGuideModal, setShowPwaGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'rfid' | 'supabase' | 'pwa' | 'backup'>('general');
  const { isInstallable, isInstalled, isIOS, isAndroid, isStandalone, isInIframe, openInNewTab, promptInstall } = usePWAInstall();
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isFullWaModalOpen, setIsFullWaModalOpen] = useState(false);
  const [testReminderLoading, setTestReminderLoading] = useState(false);

  // Delete All Data State
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteFromCloudOption, setDeleteFromCloudOption] = useState(isSupabaseConfigured);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // WhatsApp Connection Test State
  const [waTestPhone, setWaTestPhone] = useState(settings.whatsapp?.admin_phone || '081234567890');
  const [waTestLoading, setWaTestLoading] = useState(false);
  const [waTestResult, setWaTestResult] = useState<TestConnectionResult | null>(null);
  const [showWaTestDetails, setShowWaTestDetails] = useState(false);

  const handleRunTestConnection = async () => {
    if (!waTestPhone.trim()) return;
    setWaTestLoading(true);
    setWaTestResult(null);
    try {
      const res = await testWhatsAppConnection(waTestPhone.trim());
      setWaTestResult(res);
    } catch (err: any) {
      setWaTestResult({
        success: false,
        status: 'error',
        message: err?.message || 'Gagal menjalankan uji koneksi WhatsApp',
        timestamp: new Date().toISOString(),
        endpointUrl: settings.whatsapp?.webhook_url || DEFAULT_LIVE_WA_GATEWAY_URL,
        targetPhone: waTestPhone,
        verificationMessage: '',
        details: String(err)
      });
    } finally {
      setWaTestLoading(false);
    }
  };

  const [supabaseTestLoading, setSupabaseTestLoading] = useState(false);
  const [supabaseSyncLoading, setSupabaseSyncLoading] = useState(false);
  const [supabasePullLoading, setSupabasePullLoading] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSyncToSupabase = async () => {
    setSupabaseSyncLoading(true);
    setSyncStatusMessage(null);
    try {
      const res = await syncWithSupabase();
      setSyncStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
    } catch (err: any) {
      setSyncStatusMessage({
        type: 'error',
        text: err?.message || String(err)
      });
    } finally {
      setSupabaseSyncLoading(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setSupabasePullLoading(true);
    setSyncStatusMessage(null);
    try {
      const res = await pullFromSupabase();
      setSyncStatusMessage({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
    } catch (err: any) {
      setSyncStatusMessage({
        type: 'error',
        text: err?.message || String(err)
      });
    } finally {
      setSupabasePullLoading(false);
    }
  };
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
  } | null>(null);

  const handleTestSupabase = async () => {
    setSupabaseTestLoading(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestResult({
        tested: true,
        connected: res.connected,
        message: res.message
      });
    } catch (err: any) {
      setSupabaseTestResult({
        tested: true,
        connected: false,
        message: String(err?.message || err)
      });
    } finally {
      setSupabaseTestLoading(false);
    }
  };

  // Form State
  const [formState, setFormState] = useState({
    library_name: settings.library_name,
    institution_name: settings.institution_name,
    open_time: settings.open_time,
    close_time: settings.close_time,
    max_visit_minutes: settings.max_visit_minutes,
    capacity: settings.capacity,
    sound_enabled: settings.sound_enabled,
    dark_mode: Boolean(settings.dark_mode),
    auto_reset_seconds: settings.auto_reset_seconds,
    kiosk_tap_cooldown_seconds: settings.kiosk_tap_cooldown_seconds ?? 4,
    anti_passback_seconds: settings.anti_passback_seconds ?? 30,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportJson = () => {
    const backupData = {
      exported_at: new Date().toISOString(),
      settings,
      students,
      cards,
      visits,
      books,
      loans,
      awards,
      whatsappLogs
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LibraryTap_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmDeleteAll = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'HAPUS') return;
    setIsDeletingAll(true);
    try {
      await clearAllData({ deleteFromCloud: deleteFromCloudOption });
      setIsDeleteAllModalOpen(false);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Error saat menghapus data:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pengaturan Sistem & Database
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Konfigurasi operasional perpustakaan, tema tampilan, parameter scanner RFID, dan skema database Supabase.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'general' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Konfigurasi Umum
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'whatsapp' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Notifikasi WhatsApp</span>
          {settings.whatsapp?.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rfid')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'rfid' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Parameter Scanner RFID
        </button>
        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'supabase' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Skema Supabase SQL</span>
        </button>
        <button
          onClick={() => setActiveTab('pwa')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pwa' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Aplikasi & PWA (Download)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            {isInstalled ? 'Terpasang' : 'Siap Download'}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'backup' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Cadangan & Reset
        </button>
      </div>

      {/* TAB 1: Konfigurasi Umum */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          
          {/* Dedicated Dark Mode Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                formState.dark_mode ? 'bg-indigo-600 text-amber-300 shadow-md shadow-indigo-900/30' : 'bg-amber-100 text-amber-700'
              }`}>
                {formState.dark_mode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Mode Gelap (Dark Mode)</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    formState.dark_mode 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {formState.dark_mode ? 'AKTIF (Dark)' : 'NONAKTIF (Light)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
                  Mengubah warna antarmuka ke palet gelap yang elegan untuk kenyamanan mata santri dan petugas di ruangan perpustakaan redup atau saat malam hari.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                id="toggle-dark-mode-btn"
                onClick={() => {
                  const newMode = !formState.dark_mode;
                  setFormState({ ...formState, dark_mode: newMode });
                  updateSettings({ dark_mode: newMode });
                }}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  formState.dark_mode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={formState.dark_mode}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-xs ${
                    formState.dark_mode ? 'translate-x-6 text-indigo-700' : 'translate-x-0 text-amber-600'
                  }`}
                >
                  {formState.dark_mode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Nama Perpustakaan
              </label>
              <input
                type="text"
                required
                value={formState.library_name}
                onChange={(e) => setFormState({ ...formState, library_name: e.target.value })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Nama Pesantren / Institusi
              </label>
              <input
                type="text"
                required
                value={formState.institution_name}
                onChange={(e) => setFormState({ ...formState, institution_name: e.target.value })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Jam Buka Operasional
              </label>
              <input
                type="time"
                value={formState.open_time}
                onChange={(e) => setFormState({ ...formState, open_time: e.target.value })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Jam Tutup Operasional
              </label>
              <input
                type="time"
                value={formState.close_time}
                onChange={(e) => setFormState({ ...formState, close_time: e.target.value })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Kapasitas Maksimal Ruangan (Santri)
              </label>
              <input
                type="number"
                min={10}
                max={500}
                value={formState.capacity}
                onChange={(e) => setFormState({ ...formState, capacity: Number(e.target.value) })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Batas Rekomendasi Durasi Membaca (Menit)
              </label>
              <input
                type="number"
                min={30}
                max={480}
                value={formState.max_visit_minutes}
                onChange={(e) => setFormState({ ...formState, max_visit_minutes: Number(e.target.value) })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Idle Session Security & Auto-Logout Notice */}
          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-800">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Keamanan Sesi Petugas (Idle Session Timeout)
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Aktif 60 Menit
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Petugas otomatis di-logout setelah <strong>60 menit</strong> tidak ada aktivitas. Dialog peringatan muncul pada menit ke-<strong>50</strong> (sisa 10 menit).
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-simulate-idle-warning"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('simulate-idle-warning'));
                }}
                className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                title="Buka dialog peringatan 50 menit sekarang untuk pengujian"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Uji Peringatan Sesi (Simulasi 50 Menit)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {savedSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Pengaturan berhasil disimpan!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB: WhatsApp Integration */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Integrasi Notifikasi WhatsApp</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Kirim pesan otomatis saat santri tap kartu (masuk/keluar) serta notifikasi pengingat buka/tutup perpustakaan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFullWaModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Settings className="w-4 h-4" />
                <span>Buka Panel WhatsApp Penuh</span>
              </button>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status Fitur</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    settings.whatsapp?.enabled 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {settings.whatsapp?.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({
                    whatsapp: {
                      ...settings.whatsapp!,
                      enabled: !settings.whatsapp?.enabled
                    }
                  })}
                  className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {settings.whatsapp?.enabled ? 'Nonaktifkan Notifikasi' : 'Aktifkan Notifikasi'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Mode Pengiriman</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {settings.whatsapp?.webhook_url ? '⚡ Live Gateway Cloud' : 'Direct wa.me'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Admin: {settings.whatsapp?.admin_phone || 'Belum diatur'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pengingat Jadwal</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    settings.whatsapp?.notify_schedule_reminder 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {settings.whatsapp?.notify_schedule_reminder ? `${settings.whatsapp?.reminder_minutes_before || 15} Menit Sebelum` : 'NONAKTIF'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={triggerScheduleCheckNow}
                  className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Cek Jadwal Sekarang</span>
                </button>
              </div>
            </div>

            {/* Test Connection Card */}
            <div id="wa-test-connection-section" className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                      Uji Koneksi WhatsApp Gateway (Test Connection)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kirim pesan verifikasi ke nomor tujuan untuk memastikan Endpoint API dan Kunci Otorisasi (API Key) sudah terkonfigurasi dengan tepat.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Gateway Siap
                  </span>
                </div>
              </div>

              {/* Endpoint & Key Info Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Endpoint REST API</span>
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate" title={settings.whatsapp?.webhook_url || DEFAULT_LIVE_WA_GATEWAY_URL}>
                      {settings.whatsapp?.webhook_url || DEFAULT_LIVE_WA_GATEWAY_URL}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5">
                  <Key className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Kunci Otorisasi (API Key)</span>
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                      {settings.whatsapp?.webhook_api_key 
                        ? `${settings.whatsapp.webhook_api_key.substring(0, 10)}••••••••` 
                        : `${DEFAULT_LIVE_WA_API_KEY.substring(0, 10)}•••••••• (Default Resmi)`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Input & Trigger */}
              <div className="pt-1">
                <label htmlFor="input-test-wa-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor WhatsApp Penerima Pesan Verifikasi:
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      id="input-test-wa-phone"
                      type="text"
                      value={waTestPhone}
                      onChange={(e) => setWaTestPhone(e.target.value)}
                      placeholder="Contoh: 081234567890 atau 6281234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <button
                    id="btn-test-connection"
                    type="button"
                    disabled={waTestLoading || !waTestPhone.trim()}
                    onClick={handleRunTestConnection}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
                  >
                    {waTestLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menguji Koneksi...</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4" />
                        <span>Test Connection</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Menggunakan endpoint POST resmi dan header Authorization Bearer untuk memverifikasi kesiapan gateway secara langsung.
                </p>
              </div>

              {/* Test Result Display */}
              {waTestResult && (
                <div 
                  id="wa-test-result-box"
                  className={`p-4 rounded-xl border transition-all animate-in fade-in space-y-2 ${
                    waTestResult.success 
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                      : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {waTestResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm">
                          {waTestResult.success ? `Koneksi Berhasil Terverifikasi! (HTTP ${waTestResult.httpStatus || 200})` : 'Koneksi Gagal / Terkendala'}
                        </h5>
                        <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                          {waTestResult.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {waTestResult.success && (
                        <a
                          href={createWhatsAppDirectLink(waTestResult.targetPhone, waTestResult.verificationMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                        >
                          <span>Buka WA</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowWaTestDetails(!showWaTestDetails)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showWaTestDetails ? 'Tutup Respon' : 'Detail Respon'}</span>
                        {showWaTestDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {showWaTestDetails && waTestResult.details && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">
                        Payload Response Server:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {waTestResult.details}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions & Test Trigger */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Tes Cepat Pengingat WhatsApp</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Uji coba pengiriman pesan template pengingat buka atau tutup ke nomor admin ({settings.whatsapp?.admin_phone || 'Default'}).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={testReminderLoading}
                  onClick={async () => {
                    setTestReminderLoading(true);
                    await sendCustomWhatsAppReminder('open_reminder');
                    setTestReminderLoading(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Tes Pengingat Buka</span>
                </button>
                <button
                  type="button"
                  disabled={testReminderLoading}
                  onClick={async () => {
                    setTestReminderLoading(true);
                    await sendCustomWhatsAppReminder('close_reminder');
                    setTestReminderLoading(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Tes Pengingat Tutup</span>
                </button>
              </div>
            </div>

            {/* Recent WhatsApp Logs List preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Riwayat Pesan Terkirim Terakhir ({whatsappLogs.length})</h4>
                <button
                  type="button"
                  onClick={() => setIsFullWaModalOpen(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Selengkapnya & Template</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {whatsappLogs.length === 0 ? (
                <div className="text-center py-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  Belum ada riwayat pesan WhatsApp yang dikirimkan. Pesan akan tercatat otomatis saat ada santri tap kartu atau saat jadwal pengingat berbunyi.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {whatsappLogs.slice(0, 5).map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          log.type === 'check_in' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : log.type === 'check_out'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {log.type === 'check_in' ? 'TAP MASUK' : log.type === 'check_out' ? 'TAP KELUAR' : 'PENGINGAT'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{log.recipient_name} ({log.phone_number})</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">{log.message}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Parameter Scanner RFID */}
      {activeTab === 'rfid' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Pengaturan Scanner & Terminal Absensi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi respon suara dan waktu kembali layar scanner.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Durasi Tampil Kartu Sebelum Kembali (Detik)
              </label>
              <input
                type="number"
                min={2}
                max={15}
                value={formState.auto_reset_seconds}
                onChange={(e) => setFormState({ ...formState, auto_reset_seconds: Number(e.target.value) })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Layar scanner otomatis reset ke "Silakan Tap Kartu" setelah durasi ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Efek Audio / Bunyi Bip Scanner
              </label>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="sound_toggle"
                  checked={formState.sound_enabled}
                  onChange={(e) => setFormState({ ...formState, sound_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="sound_toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Aktifkan Bunyi Bip & Chime Masuk/Keluar
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Jeda Anti-Double Tap per Kartu (Detik)
              </label>
              <input
                type="number"
                min={2}
                max={30}
                value={formState.kiosk_tap_cooldown_seconds}
                onChange={(e) => setFormState({ ...formState, kiosk_tap_cooldown_seconds: Number(e.target.value) })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Mengabaikan sinyal pembacaan berulang dari kartu yang sama dalam selang waktu singkat (mencegah double tap perangkat keras).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Jeda Proteksi Anti-Passback Masuk-Keluar (Detik)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={formState.anti_passback_seconds}
                onChange={(e) => setFormState({ ...formState, anti_passback_seconds: Number(e.target.value) })}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Waktu tunggu minimum setelah Check-In sebelum santri diizinkan Check-Out (mencegah kartu langsung ter-checkout jika tidak sengaja ter-tap lagi saat baru masuk).
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {savedSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Parameter RFID tersimpan!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Parameter</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Skema Supabase SQL */}
      {activeTab === 'supabase' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          {/* Connection Status Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Integrasi Database Supabase
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Auto-Sync Cloud Aktif
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <RefreshCw className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                      Real-time Langsung Tersimpan
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Setiap input/edit data otomatis langsung tersimpan ke Supabase (<code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{SUPABASE_URL}</code>)
                    {lastRealtimeSync && (
                      <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">
                        • Sinkron terakhir: {new Date(lastRealtimeSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-test-supabase-connection"
                disabled={supabaseTestLoading}
                onClick={handleTestSupabase}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-center disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${supabaseTestLoading ? 'animate-spin' : ''}`} />
                <span>{supabaseTestLoading ? 'Memeriksa Koneksi...' : 'Uji Koneksi Supabase'}</span>
              </button>
            </div>

            {/* Test result message feedback */}
            {supabaseTestResult && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                supabaseTestResult.connected 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {supabaseTestResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">
                  <span className="font-bold block mb-0.5">{supabaseTestResult.connected ? 'Status Koneksi Terhubung' : 'Hasil Pengecekan'}</span>
                  {supabaseTestResult.message}
                </div>
              </div>
            )}

            {/* Cloud Data Synchronization Action Block */}
            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sinkronisasi Data Perpustakaan ke Cloud Supabase
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {students.length} Santri • {books.length} Buku • {cards.length} Kartu • {visits.length} Presensi • {awards.length} Arsip Piagam
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-sync-to-supabase"
                  disabled={supabaseSyncLoading || isSupabaseSyncing}
                  onClick={handleSyncToSupabase}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className={`w-3.5 h-3.5 ${supabaseSyncLoading ? 'animate-bounce' : ''}`} />
                  <span>{supabaseSyncLoading ? 'Mengunggah...' : 'Sinkronkan ke Cloud'}</span>
                </button>

                <button
                  type="button"
                  id="btn-pull-from-supabase"
                  disabled={supabasePullLoading || isSupabaseSyncing}
                  onClick={handlePullFromSupabase}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${supabasePullLoading ? 'animate-bounce' : ''}`} />
                  <span>{supabasePullLoading ? 'Memuat...' : 'Tarik Data Cloud'}</span>
                </button>
              </div>
            </div>

            {/* Sync feedback message */}
            {syncStatusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                syncStatusMessage.type === 'success'
                  ? 'bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                  : 'bg-rose-100/70 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200'
              }`}>
                {syncStatusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{syncStatusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Offline RFID Tap Queue Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                !isOnline
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : offlineQueueCount > 0
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              }`}>
                {!isOnline ? <WifiOff className="w-5 h-5" /> : <Database className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Antrean Tap RFID Offline (Local Storage)
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    !isOnline 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {offlineQueueCount > 0
                    ? `Terdapat ${offlineQueueCount} tap presensi tersimpan lokal di browser karena kendala koneksi atau kegagalan server.`
                    : 'Semua tap presensi RFID telah tersinkronisasi ke server Supabase Cloud.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowOfflineQueueModal(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Lihat Antrean ({offlineQueueCount})
              </button>
              {offlineQueueCount > 0 && (
                <button
                  type="button"
                  disabled={isProcessingOfflineQueue || !isOnline}
                  onClick={() => flushOfflineQueue()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessingOfflineQueue ? 'animate-spin' : ''}`} />
                  <span>{isProcessingOfflineQueue ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Langkah Cepat Setup Database:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1 leading-relaxed">
              <li>Klik tombol <strong>"Salin Skema SQL"</strong> di bawah ini.</li>
              <li>Buka dashboard Supabase Anda di <code className="font-mono text-blue-600 dark:text-blue-400">wucnvwjkbvrsghkdumbh.supabase.co</code> &rarr; pilih menu <strong>SQL Editor</strong>.</li>
              <li>Klik <strong>New Query</strong>, tempelkan (*Paste*) skrip SQL, lalu klik tombol hijau <strong>Run</strong>.</li>
              <li>Tabel otomatis terbuat lengkap dengan trigger durasi dan Row Level Security (RLS).</li>
            </ol>
          </div>

          {/* SQL Viewer and Copy Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Skrip DDL PostgreSQL (Siap Dijalankan)</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mencakup tabel students, rfid_cards, library_visits, books, book_loans, users, trigger durasi, dan RLS policies.
              </p>
            </div>

            <button
              id="btn-copy-sql-schema"
              type="button"
              onClick={handleCopySql}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skema SQL'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[380px] border border-slate-800 leading-relaxed">
            <pre>{supabaseSchema}</pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">1. students</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">id, nis, name, class, gender, photo_url, status</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">2. rfid_cards</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">id, uid, student_id (FK), status, registered_at</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">3. library_visits</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">id, student_id, check_in, check_out, duration</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">4. books & book_loans</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">code, title, author, loans, fine_amount</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Backup & Reset */}
      {activeTab === 'backup' && (
        <div id="tab-backup-reset" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Cadangan Data & Reset Sistem</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ekspor seluruh basis data ke file JSON, pembersihan cache, atau penghapusan total seluruh data perpustakaan.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div id="card-export-backup" className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Ekspor Cadangan Lengkap (JSON)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Unduh seluruh database (data santri, kartu RFID, riwayat kunjungan, buku, peminjaman, piagam, dan pengaturan).
                </p>
              </div>
              <button
                id="btn-export-backup"
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (.json)</span>
              </button>
            </div>

            <div id="card-clean-dummy-cache" className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-1">Bersihkan Cache & Data Dummy</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                  Menghapus seluruh cache lokal, sisa data dummy/palsu, dan mengembalikan sistem ke kondisi bersih (Clean Slate).
                </p>
              </div>
              <button
                id="btn-reset-dummy"
                onClick={resetToDefaultData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kosongkan & Bersihkan Data Dummy</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Hapus Semua Data */}
          <div id="section-danger-zone-delete" className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div id="card-delete-all-data" className="p-5 sm:p-6 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/70 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm sm:text-base">
                    Hapus Semua Data
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 uppercase tracking-wider">
                    Zona Bahaya
                  </span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                  Menghapus secara permanen seluruh data operasional perpustakaan meliputi seluruh data santri ({students.length}), kartu RFID ({cards.length}), katalog buku ({books.length}), riwayat peminjaman ({loans.length}), riwayat kunjungan ({visits.length}), piagam ({awards.length}), dan log notifikasi.
                </p>
              </div>
              <button
                id="btn-trigger-delete-all"
                onClick={() => {
                  setDeleteConfirmText('');
                  setIsDeleteAllModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Aplikasi & PWA (Download & Online Database Sync) */}
      {activeTab === 'pwa' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-600/15 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-emerald-100">
                  <Database className="w-3.5 h-3.5" />
                  <span>Aplikasi Online Terintegrasi Database Cloud Supabase</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Download & Pasang Aplikasi Perpustakaan
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Aplikasi yang dipasang <strong>tetap 100% online dan terhubung langsung ke database Supabase</strong> secara real-time. Anda dapat memasang sistem perpustakaan langsung di smartphone Android, iPhone, tablet, maupun komputer/laptop untuk akses cepat dari layar utama.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  id="btn-pwa-tab-install"
                  onClick={async () => {
                    if (isInstallable) {
                      const res = await promptInstall();
                      if (res === 'accepted') return;
                    }
                    setShowPwaGuideModal(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{isInstalled ? 'Buka Panduan / QR' : 'Pasang di Perangkat Ini'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPwaGuideModal(true)}
                  className="px-4 py-3 rounded-2xl bg-emerald-800/40 hover:bg-emerald-800/60 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Petunjuk Perangkat & QR</span>
                </button>
              </div>
            </div>
          </div>

          {/* Iframe Warning Alert: Why browser says 'This app cannot be installed' */}
          {isInIframe && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-100">
                    Membuka di Pratinjau Editor? Browser Memerlukan Tab Baru untuk Menginstal
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Google Chrome & Edge memblokir instalasi PWA dari dalam jendela pratinjau editor (iFrame) sehingga memunculkan pesan <em>"This app cannot be installed"</em>. Buka di Tab Baru untuk mengaktifkan instalasi instan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openInNewTab}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka di Tab Baru Sekarang</span>
              </button>
            </div>
          )}

          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mode Tampilan</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isStandalone 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {isStandalone ? 'Aplikasi Layar Penuh (PWA)' : 'Browser Tab'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isStandalone ? 'Standalone Window Mode' : 'Web Browser Standar'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isStandalone 
                  ? 'Aplikasi berjalan tanpa bilah URL browser, persis seperti aplikasi native.' 
                  : 'Bisa dipasang ke layar utama agar tampil seperti aplikasi native.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status Instalasi</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isInstalled 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {isInstalled ? 'Terpasang' : 'Tersedia'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isInstalled ? 'Aplikasi Sudah Terpasang' : 'Siap Diunduh & Dipasang'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isInstalled
                  ? 'Aplikasi terdaftar di sistem perangkat Anda.'
                  : 'Klik tombol "Pasang di Perangkat Ini" untuk menambahkan ikon aplikasi.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Database Cloud</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isOnline 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {isOnline ? 'Online (Supabase Terhubung)' : 'Mode Antrean Darurat'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isOnline ? 'Supabase PostgreSQL Real-time' : 'Menunggu Jaringan Kembali'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isOnline 
                  ? 'Semua transaksi buku, presensi santri, dan usulan buku langsung tersinkron online.' 
                  : `Tersimpan aman di antrean offline (${offlineQueueCount} data) dan akan dikirim saat online.`}
              </p>
            </div>
          </div>

          {/* Device Installation Guide Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Petunjuk Pemasangan Cepat Berdasarkan Perangkat</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Android (Google Chrome)
                  </h5>
                </div>
                <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Buka browser Google Chrome di HP Anda.</li>
                  <li>Ketuk ikon titik tiga <strong className="text-slate-700 dark:text-slate-300">⋮</strong> di pojok kanan atas.</li>
                  <li>Pilih opsi <strong className="text-emerald-600 dark:text-emerald-400">"Pasang aplikasi"</strong> atau <strong className="text-emerald-600 dark:text-emerald-400">"Tambahkan ke Layar Utama"</strong>.</li>
                  <li>Konfirmasi pemasangan, ikon aplikasi akan muncul di beranda HP.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    iPhone / iPad (Apple Safari)
                  </h5>
                </div>
                <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Buka halaman ini menggunakan browser bawaan <strong className="text-slate-700 dark:text-slate-300">Safari</strong>.</li>
                  <li>Ketuk tombol <strong className="text-blue-600 dark:text-blue-400">Share</strong> (ikon kotak panah ke atas) di bilah bawah.</li>
                  <li>Gulir ke bawah dan ketuk opsi <strong className="text-blue-600 dark:text-blue-400">"Add to Home Screen"</strong> (Tambah ke Layar Utama).</li>
                  <li>Ketuk <strong className="text-slate-700 dark:text-slate-300">Add (Tambah)</strong> di pojok kanan atas.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-black">
                    3
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    PC / Laptop (Chrome / Edge)
                  </h5>
                </div>
                <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Buka link aplikasi di Chrome atau Edge pada laptop/PC.</li>
                  <li>Perhatikan ikon <strong className="text-indigo-600 dark:text-indigo-400">Download / Pasang</strong> di sebelah kanan bilah alamat (address bar).</li>
                  <li>Atau buka Menu browser &gt; <strong className="text-indigo-600 dark:text-indigo-400">Pasang Aplikasi Perpustakaan</strong>.</li>
                  <li>Aplikasi kini bisa dibuka langsung dari Desktop atau Start Menu.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi: Hapus Semua Data */}
      {isDeleteAllModalOpen && (
        <div 
          id="modal-delete-all-overlay" 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-all-title"
        >
          <div 
            id="modal-delete-all-container" 
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-delete-all-title" className="font-extrabold text-slate-900 dark:text-white text-base">
                    Konfirmasi Hapus Semua Data
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                    Tindakan ini permanen dan tidak dapat dibatalkan!
                  </p>
                </div>
              </div>
              <button
                id="btn-close-delete-all-modal"
                onClick={() => {
                  if (!isDeletingAll) {
                    setIsDeleteAllModalOpen(false);
                    setDeleteConfirmText('');
                  }
                }}
                disabled={isDeletingAll}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Summary of Data to be deleted */}
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Rincian data yang akan dihapus permanen:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Santri</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{students.length} data</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kartu RFID</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{cards.length} kartu</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Katalog Buku</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{books.length} judul</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Peminjaman</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{loans.length} transaksi</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kunjungan</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{visits.length} sesi</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Piagam & Log</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{awards.length + whatsappLogs.length} entri</span>
                  </div>
                </div>
              </div>

              {/* Cloud Database Option */}
              {isSupabaseConfigured && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
                  <input
                    id="checkbox-delete-cloud"
                    type="checkbox"
                    checked={deleteFromCloudOption}
                    onChange={(e) => setDeleteFromCloudOption(e.target.checked)}
                    disabled={isDeletingAll}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <label htmlFor="checkbox-delete-cloud" className="text-xs text-blue-900 dark:text-blue-300 cursor-pointer select-none leading-relaxed">
                    <span className="font-bold block flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5" />
                      Kosongkan juga basis data di Supabase Cloud
                    </span>
                    Tabel di server Supabase (students, rfid_cards, books, book_loans, library_visits, literacy_awards) akan ikut dibersihkan.
                  </label>
                </div>
              )}

              {/* Safety Confirmation Text */}
              <div className="space-y-2 pt-1">
                <label htmlFor="input-confirm-delete" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ketik kata <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">HAPUS</span> untuk melanjutkan:
                </label>
                <input
                  id="input-confirm-delete"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Ketik HAPUS di sini"
                  disabled={isDeletingAll}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                id="btn-cancel-delete-all"
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeletingAll}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-all-action"
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'HAPUS' || isDeletingAll}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Semua Data Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Full Management Modal */}
      {isFullWaModalOpen && (
        <WhatsAppManagerModal
          isOpen={isFullWaModalOpen}
          onClose={() => setIsFullWaModalOpen(false)}
        />
      )}

      {/* Offline RFID Queue Management Modal */}
      {showOfflineQueueModal && (
        <OfflineQueueModal
          isOpen={showOfflineQueueModal}
          onClose={() => setShowOfflineQueueModal(false)}
        />
      )}

      {/* PWA Install Modal with Guide and QR Code */}
      <PWAInstallModal
        isOpen={showPwaGuideModal}
        onClose={() => setShowPwaGuideModal(false)}
      />
    </div>
  );
};
