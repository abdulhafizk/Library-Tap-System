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
  CheckCircle2,
  Terminal,
  Moon,
  Sun,
  Palette,
  MessageSquare,
  Send,
  ExternalLink
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { WhatsAppManagerModal } from './WhatsAppManagerModal';

export const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    toggleDarkMode,
    isDarkMode,
    resetToDefaultData, 
    supabaseSchema, 
    students, 
    cards, 
    visits,
    whatsappLogs,
    openWhatsAppModal,
    triggerScheduleCheckNow,
    sendCustomWhatsAppReminder
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'rfid' | 'supabase' | 'backup'>('general');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isFullWaModalOpen, setIsFullWaModalOpen] = useState(false);
  const [testReminderLoading, setTestReminderLoading] = useState(false);

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
      visits
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LibraryTap_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {settings.whatsapp?.provider === 'webhook' ? 'Webhook / Bot API' : 'Direct wa.me'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Target: {settings.whatsapp?.admin_phone || 'Belum diatur'}
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
                max={10}
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Struktur Database Supabase PostgreSQL</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                DDL Script lengkap dengan tabel, relasi foreign key, trigger durasi otomatis, index pencarian, dan RLS.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skema SQL'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[420px] border border-slate-800 leading-relaxed">
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
              <span className="font-bold text-slate-800 dark:text-slate-200 block">4. users</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">id, name, email, role (admin/staff)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Backup & Reset */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">Cadangan Data & Reset Sistem</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ekspor seluruh basis data ke file JSON atau reset ke data demo default.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Ekspor Cadangan Lengkap (JSON)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Unduh seluruh database (data santri, kartu RFID, riwayat kunjungan, dan pengaturan).
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (.json)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm mb-1">Kembalikan Data Demo (Reset)</h4>
                <p className="text-xs text-rose-700 dark:text-rose-400 mb-4">
                  Mengembalikan semua santri, kartu, sesi kunjungan, dan konfigurasi ke setelan awal.
                </p>
              </div>
              <button
                onClick={resetToDefaultData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset ke Data Demo Awal</span>
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
    </div>
  );
};
