import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Clock, 
  Bell, 
  Smartphone, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  DoorOpen, 
  DoorClosed,
  Zap,
  Globe,
  Lock,
  Trash2,
  Server,
  Play
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { 
  defaultWhatsAppConfig, 
  WhatsAppNotificationConfig, 
  formatPhoneNumberToWA, 
  createWhatsAppDirectLink,
  DEFAULT_LIVE_WA_GATEWAY_URL,
  DEFAULT_LIVE_WA_API_KEY,
  testGatewayConnection 
} from '../../utils/whatsappUtils';

export const WhatsAppManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    activeVisitsCount, 
    whatsappLogs, 
    sendCustomWhatsAppReminder, 
    triggerScheduleCheckNow,
    clearWhatsAppLogs 
  } = useLibrary();

  const currentWaConfig = settings.whatsapp || defaultWhatsAppConfig;

  const [formConfig, setFormConfig] = useState<WhatsAppNotificationConfig>(() => ({
    ...defaultWhatsAppConfig,
    ...currentWaConfig,
    webhook_url: currentWaConfig.webhook_url || DEFAULT_LIVE_WA_GATEWAY_URL,
    webhook_api_key: currentWaConfig.webhook_api_key || DEFAULT_LIVE_WA_API_KEY,
  }));
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'broadcast' | 'logs'>('config');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Test State
  const [testPhone, setTestPhone] = useState(formConfig.admin_phone || '081234567890');
  const [testMessage, setTestMessage] = useState('🌟 Tes integrasi WhatsApp Gateway Perpustakaan Pesantren. Endpoint live aktif dan terhubung!');
  const [isTestingLive, setIsTestingLive] = useState(false);
  const [liveTestResponse, setLiveTestResponse] = useState<{ status: 'success' | 'error'; message: string; fullDetails?: string } | null>(null);

  // Broadcast manual state
  const [broadcastTarget, setBroadcastTarget] = useState<'admin' | 'custom'>('admin');
  const [customPhone, setCustomPhone] = useState('');
  const [broadcastType, setBroadcastType] = useState<'open_reminder' | 'close_reminder'>('close_reminder');
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ whatsapp: formConfig });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const applyOfficialLiveGatewayPreset = () => {
    setFormConfig(prev => ({
      ...prev,
      provider: 'live_gateway',
      webhook_url: DEFAULT_LIVE_WA_GATEWAY_URL,
      webhook_api_key: DEFAULT_LIVE_WA_API_KEY,
    }));
  };

  const handleRunLiveTest = async () => {
    setIsTestingLive(true);
    setLiveTestResponse(null);
    try {
      const res = await testGatewayConnection(
        testPhone,
        formConfig,
        testMessage || undefined
      );

      setLiveTestResponse({
        status: res.status,
        message: res.message,
        fullDetails: res.details || res.rawResponse
      });
    } catch (err: any) {
      setLiveTestResponse({
        status: 'error',
        message: `Network/CORS info: ${err?.message || 'Request gagal'}. Format URL dan Header telah disesuaikan.`,
        fullDetails: String(err?.stack || err)
      });
    } finally {
      setIsTestingLive(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendManualBroadcast = async () => {
    setIsSending(true);
    setBroadcastResult(null);
    try {
      const targetPhone = broadcastTarget === 'admin' ? formConfig.admin_phone : customPhone;
      if (!targetPhone) {
        setBroadcastResult('Harap masukkan nomor WhatsApp tujuan!');
        setIsSending(false);
        return;
      }

      const log = await sendCustomWhatsAppReminder(broadcastType, targetPhone);
      setBroadcastResult(`Pesan pengingat berhasil diproses (${log.status === 'sent' ? 'Terkirim via Webhook' : 'Siap dikirim via WhatsApp'})`);
    } catch (err: any) {
      setBroadcastResult(`Gagal mengirim: ${err?.message || 'Error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Integrasi Notifikasi WhatsApp Otomatis
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  formConfig.enabled 
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {formConfig.enabled ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kirim otomatis pesan santri Masuk/Keluar & Pengingat Perpustakaan Buka/Tutup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            ⚙️ Pengaturan & Gateway
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            📝 Template Pesan WA
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'broadcast'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Kirim Pengingat Manual</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span>Histori Log WA</span>
            {whatsappLogs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full font-bold">
                {whatsappLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: Config */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Master Toggle */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Aktifkan Layanan WhatsApp</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aktifkan notifikasi otomatis saat santri tap RFID dan pengingat jam operasional.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formConfig.enabled}
                    onChange={(e) => setFormConfig({ ...formConfig, enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Checkbox Trigger Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.notify_on_check_in}
                    onChange={(e) => setFormConfig({ ...formConfig, notify_on_check_in: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Kirim saat Santri Masuk (Check-In)</div>
                    <div className="text-[11px] text-slate-500">Notifikasi detail nama santri, kelas, dan jam tap masuk.</div>
                  </div>
                </label>

                <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.notify_on_check_out}
                    onChange={(e) => setFormConfig({ ...formConfig, notify_on_check_out: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Kirim saat Santri Keluar (Check-Out)</div>
                    <div className="text-[11px] text-slate-500">Notifikasi durasi waktu membaca santri dan jam keluar.</div>
                  </div>
                </label>

                <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.notify_schedule_reminder}
                    onChange={(e) => setFormConfig({ ...formConfig, notify_schedule_reminder: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Pengingat Buka / Tutup Otomatis</div>
                    <div className="text-[11px] text-slate-500">Peringatan sebelum perpustakaan buka ({settings.open_time}) atau tutup ({settings.close_time}).</div>
                  </div>
                </label>

                <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.use_student_parent_phone}
                    onChange={(e) => setFormConfig({ ...formConfig, use_student_parent_phone: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Kirim ke Nomor Santri / Wali Santri</div>
                    <div className="text-[11px] text-slate-500">Jika santri memiliki nomor telepon di biodata.</div>
                  </div>
                </label>
              </div>

              {/* Recipient & Schedule Setting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp Admin / Pustakawan
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formConfig.admin_phone}
                      onChange={(e) => setFormConfig({ ...formConfig, admin_phone: e.target.value })}
                      placeholder="Contoh: 081234567890 atau 6281234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Nomor ini akan menerima seluruh notifikasi tap santri & pengingat jadwal.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Waktu Pengingat Sebelum Buka / Tutup
                  </label>
                  <select
                    value={formConfig.reminder_minutes_before}
                    onChange={(e) => setFormConfig({ ...formConfig, reminder_minutes_before: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={5}>5 Menit Sebelum ({settings.open_time} / {settings.close_time})</option>
                    <option value={10}>10 Menit Sebelum</option>
                    <option value={15}>15 Menit Sebelum (Direkomendasikan)</option>
                    <option value={30}>30 Menit Sebelum</option>
                    <option value={60}>60 Menit (1 Jam) Sebelum</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Jadwal operasional saat ini: {settings.open_time} - {settings.close_time} WIB.</p>
                </div>
              </div>

              {/* Webhook Gateway & Provider Setup */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Gateway & REST API WhatsApp
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={applyOfficialLiveGatewayPreset}
                    className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Pakai Gateway Live Resmi Pesantren</span>
                  </button>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Layanan gateway aktif menggunakan REST API Cloud Run untuk pengiriman notifikasi otomatis saat santri tap RFID (masuk/keluar), sirkulasi buku, dan pengingat jadwal perpustakaan.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Provider WhatsApp
                    </label>
                    <select
                      value={formConfig.provider || 'live_gateway'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        let url = formConfig.webhook_url;
                        let key = formConfig.webhook_api_key;
                        if (val === 'live_gateway') {
                          url = DEFAULT_LIVE_WA_GATEWAY_URL;
                          key = DEFAULT_LIVE_WA_API_KEY;
                        } else if (val === 'fonnte') {
                          url = 'https://api.fonnte.com/send';
                        } else if (val === 'wablas') {
                          url = 'https://kudus.wablas.com/api/send-message';
                        } else if (val === 'whacenter') {
                          url = 'https://app.whacenter.com/api/send';
                        }
                        setFormConfig({ ...formConfig, provider: val, webhook_url: url, webhook_api_key: key });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="live_gateway">🌟 Live WA Gateway Pesantren (Cloud Service)</option>
                      <option value="fonnte">Fonnte (Gateway Indonesia)</option>
                      <option value="wablas">Wablas Gateway</option>
                      <option value="whacenter">Whacenter Gateway</option>
                      <option value="generic">Generic REST Webhook / Baileys</option>
                      <option value="custom">Custom Endpoint API</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Buka Tautan wa.me Otomatis Saat Tap
                    </label>
                    <div className="flex items-center h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={formConfig.auto_open_direct_link || false}
                          onChange={(e) => setFormConfig({ ...formConfig, auto_open_direct_link: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Buka tab WhatsApp otomatis</span>
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Endpoint URL (Method: POST)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Header: Content-Type: application/json</span>
                    </div>
                    <input
                      type="url"
                      value={formConfig.webhook_url || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, webhook_url: e.target.value })}
                      placeholder={DEFAULT_LIVE_WA_GATEWAY_URL}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Authorization Bearer Token / API Key (Header: Authorization & x-api-key)
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formConfig.webhook_api_key || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, webhook_api_key: e.target.value })}
                      placeholder="wag_live_1nt3faszsenjuu53vio03licvlor"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Direct Live Testing Module */}
                <div className="mt-4 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      <span>Uji Coba Kirim Langsung ke Gateway (Live Test)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">POST /api/v1/messages/send</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Nomor Tujuan (cth: 081234567890)"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Pesan pengujian..."
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        disabled={isTestingLive}
                        onClick={handleRunLiveTest}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isTestingLive ? 'Menguji...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>

                  {liveTestResponse && (
                    <div className={`p-2.5 rounded-lg text-xs font-mono whitespace-pre-wrap ${
                      liveTestResponse.status === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      <div className="font-bold flex items-center gap-1 mb-1">
                        {liveTestResponse.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{liveTestResponse.message}</span>
                      </div>
                      {liveTestResponse.fullDetails && (
                        <div className="text-[11px] opacity-80 max-h-24 overflow-y-auto">
                          {liveTestResponse.fullDetails}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => triggerScheduleCheckNow()}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cek Trigger Jadwal Sekarang</span>
                </button>

                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Pengaturan disimpan!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Templates */}
          {activeTab === 'templates' && (
            <div className="space-y-5">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Variabel Template Otomatis:</strong> Gunakan tag seperti <code>{'{STUDENT_NAME}'}</code>, <code>{'{STUDENT_CLASS}'}</code>, <code>{'{TIME_IN}'}</code>, <code>{'{TIME_OUT}'}</code>, <code>{'{DURATION_TEXT}'}</code>, <code>{'{LIBRARY_NAME}'}</code>, <code>{'{OPEN_TIME}'}</code>, <code>{'{CLOSE_TIME}'}</code>, dan <code>{'{REMINDER_MINUTES}'}</code>. Tag ini akan diganti otomatis saat pesan dikirim.
                </div>
              </div>

              {/* Template 1: Santri Masuk */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      1. Template Notifikasi Santri Masuk (Check-In)
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyText('t-in', formConfig.check_in_template || defaultWhatsAppConfig.check_in_template!)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedId === 't-in' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>Salin</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={formConfig.check_in_template || defaultWhatsAppConfig.check_in_template}
                  onChange={(e) => setFormConfig({ ...formConfig, check_in_template: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Template 2: Santri Keluar */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      2. Template Notifikasi Santri Keluar (Check-Out)
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyText('t-out', formConfig.check_out_template || defaultWhatsAppConfig.check_out_template!)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedId === 't-out' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>Salin</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={formConfig.check_out_template || defaultWhatsAppConfig.check_out_template}
                  onChange={(e) => setFormConfig({ ...formConfig, check_out_template: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Template 3: Pengingat Buka */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      3. Template Pengingat Sebelum Buka ({settings.open_time} WIB)
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyText('t-open', formConfig.open_reminder_template || defaultWhatsAppConfig.open_reminder_template!)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedId === 't-open' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>Salin</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={formConfig.open_reminder_template || defaultWhatsAppConfig.open_reminder_template}
                  onChange={(e) => setFormConfig({ ...formConfig, open_reminder_template: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Template 4: Pengingat Tutup */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorClosed className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      4. Template Pengingat Sebelum Tutup ({settings.close_time} WIB)
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyText('t-close', formConfig.close_reminder_template || defaultWhatsAppConfig.close_reminder_template!)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedId === 't-close' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>Salin</span>
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={formConfig.close_reminder_template || defaultWhatsAppConfig.close_reminder_template}
                  onChange={(e) => setFormConfig({ ...formConfig, close_reminder_template: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ whatsapp: formConfig });
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2500);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Template</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Broadcast Manual */}
          {activeTab === 'broadcast' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border border-amber-200/60 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Kirim Siaran Pengingat WhatsApp Sekarang</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gunakan menu ini untuk mengumumkan pengingat bahwa perpustakaan sebentar lagi buka atau tutup ke grup/nomor pustakawan atau wali santri sewaktu-waktu.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Jenis Pesan Pengingat
                  </label>
                  <select
                    value={broadcastType}
                    onChange={(e: any) => setBroadcastType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="close_reminder">⚠️ Pengingat Sebentar Lagi Tutup (Jam {settings.close_time} WIB) - {activeVisitsCount} Santri di dalam</option>
                    <option value="open_reminder">📢 Pengingat Sebentar Lagi Buka (Jam {settings.open_time} WIB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tujuan Pengiriman
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="target" 
                        checked={broadcastTarget === 'admin'} 
                        onChange={() => setBroadcastTarget('admin')} 
                        className="text-amber-600"
                      />
                      <span>Nomor Admin ({formConfig.admin_phone})</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="target" 
                        checked={broadcastTarget === 'custom'} 
                        onChange={() => setBroadcastTarget('custom')} 
                        className="text-amber-600"
                      />
                      <span>Nomor Lain / Grup</span>
                    </label>
                  </div>
                </div>
              </div>

              {broadcastTarget === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nomor WhatsApp Penerima
                  </label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Contoh: 081298765432"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              )}

              {broadcastResult && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{broadcastResult}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleSendManualBroadcast}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Memproses Pengiriman...' : 'Kirim Siaran Sekarang'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Daftar Pesan WhatsApp Terkirim
                  </h4>
                  <p className="text-[11px] text-slate-500">Histori pengiriman notifikasi tap masuk/keluar dan pengingat jadwal.</p>
                </div>
                {whatsappLogs.length > 0 && (
                  <button
                    onClick={clearWhatsAppLogs}
                    className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan Log</span>
                  </button>
                )}
              </div>

              {whatsappLogs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Belum ada aktivitas pengiriman WhatsApp</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Coba lakukan tap RFID santri di menu Tap atau kirim siaran pengingat manual.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {whatsappLogs.map((log) => {
                    const timeStr = new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                    return (
                      <div 
                        key={log.id} 
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              log.type === 'check_in' 
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                : log.type === 'check_out'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            }`}>
                              {log.type === 'check_in' ? 'TAP MASUK' : log.type === 'check_out' ? 'TAP KELUAR' : 'PENGINGAT JADWAL'}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {log.recipient_name} ({log.recipient_phone})
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {dateStr}, {timeStr} WIB
                          </span>
                        </div>

                        {/* Message Preview */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                          {log.message}
                        </div>

                        {/* Footer / Open in WA button */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {log.gateway_response || 'Tersimpan dalam log antrian'}
                          </span>

                          {log.direct_wa_link && (
                            <a
                              href={log.direct_wa_link}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-lg font-semibold flex items-center gap-1 text-[11px] transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Buka di WhatsApp Web / App</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Nomor aktif pustakawan: <strong>{formConfig.admin_phone}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
