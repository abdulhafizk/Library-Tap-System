import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  X, 
  Search, 
  BookOpen, 
  Radio, 
  Sparkles, 
  Moon, 
  Volume2, 
  MessageSquare, 
  Settings, 
  Tv, 
  Trophy, 
  Users, 
  CreditCard, 
  History, 
  DoorOpen, 
  LayoutDashboard,
  CornerDownLeft,
  CheckCircle2,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenSearch?: () => void;
  onToggleDarkMode?: () => void;
  onToggleSound?: () => void;
  onOpenWhatsApp?: () => void;
}

interface ShortcutItem {
  keys: string[];
  altKeys?: string[];
  title: string;
  desc: string;
  icon: any;
  color?: string;
  action: () => void;
}

interface ShortcutGroup {
  category: string;
  title: string;
  items: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSearch,
  onToggleDarkMode,
  onToggleSound,
  onOpenWhatsApp
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'workflow' | 'navigation' | 'system'>('all');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups: ShortcutGroup[] = [
    {
      category: 'workflow',
      title: 'Aksi Cepat & Alur Kerja Staf',
      items: [
        {
          keys: [modKey, 'K'],
          title: 'Cari Santri, Buku & Perintah Cepat',
          desc: 'Buka Spotlight pencarian global untuk santri, koleksi buku, kartu RFID, dan navigasi cepat',
          icon: Search,
          color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50',
          action: () => {
            onClose();
            if (onOpenSearch) onOpenSearch();
          }
        },
        {
          keys: [modKey, 'B'],
          title: 'Sirkulasi & Peminjaman Buku',
          desc: 'Buka modul peminjaman buku, pengembalian, perpanjangan, dan katalog inventaris',
          icon: BookOpen,
          color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50',
          action: () => {
            onClose();
            onNavigate('circulation');
          }
        },
        {
          keys: ['Alt', 'T'],
          altKeys: [modKey, 'Shift', 'T'],
          title: 'Presensi Tap Kartu RFID',
          desc: 'Buka meja tap presensi mandiri santri (RFID scanner & kamera barcode QR)',
          icon: Radio,
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50',
          action: () => {
            onClose();
            onNavigate('tap');
          }
        },
        {
          keys: ['Esc'],
          title: 'Tutup Dialog / Batal Aksi',
          desc: 'Tutup modal pencarian, form tambah data, atau jendela dialog yang sedang terbuka',
          icon: CornerDownLeft,
          color: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          action: () => onClose()
        }
      ]
    },
    {
      category: 'navigation',
      title: 'Navigasi Menu Utama',
      items: [
        {
          keys: ['Alt', '1'],
          title: 'Dashboard Beranda',
          desc: 'Ringkasan statistik harian, kunjungan aktif, dan alert buku overdue',
          icon: LayoutDashboard,
          action: () => {
            onClose();
            onNavigate('dashboard');
          }
        },
        {
          keys: ['Alt', '2'],
          altKeys: ['Alt', 'S'],
          title: 'Data Santri & Siswa',
          desc: 'Kelola direktori santri, profil, NIS, kelas, dan status keanggotaan',
          icon: Users,
          action: () => {
            onClose();
            onNavigate('students');
          }
        },
        {
          keys: ['Alt', '3'],
          altKeys: ['Alt', 'C'],
          title: 'Data Kartu RFID',
          desc: 'Pendaftaran nomor UID kartu fisik dan penugasan ke akun santri',
          icon: CreditCard,
          action: () => {
            onClose();
            onNavigate('cards');
          }
        },
        {
          keys: ['Alt', '4'],
          altKeys: ['Alt', 'R'],
          title: 'Riwayat Kunjungan',
          desc: 'Log catatan presensi masuk dan keluar santri di perpustakaan',
          icon: History,
          action: () => {
            onClose();
            onNavigate('visits');
          }
        },
        {
          keys: ['Alt', '5'],
          altKeys: ['Alt', 'L'],
          title: 'Sedang di Perpustakaan',
          desc: 'Pantau siapa saja santri yang sedang berada di ruang baca saat ini',
          icon: DoorOpen,
          action: () => {
            onClose();
            onNavigate('live');
          }
        },
        {
          keys: ['Alt', '6'],
          altKeys: ['Alt', 'P'],
          title: 'Penghargaan & XP Literasi',
          desc: 'Pemberian piagam penghargaan, poin XP, dan peringkat membaca santri',
          icon: Trophy,
          action: () => {
            onClose();
            onNavigate('awards');
          }
        },
        {
          keys: ['Alt', '8'],
          altKeys: ['Alt', 'K'],
          title: 'Display Kios TV',
          desc: 'Buka mode layar penuh tampilan TV Kiosk untuk aula perpustakaan',
          icon: Tv,
          action: () => {
            onClose();
            onNavigate('kiosk');
          }
        },
        {
          keys: ['Alt', '9'],
          altKeys: ['Alt', 'U'],
          title: 'Update Log Aplikasi',
          desc: 'Lihat catatan rilis pembaruan dan fitur-fitur baru sistem',
          icon: Sparkles,
          action: () => {
            onClose();
            onNavigate('updates');
          }
        },
        {
          keys: ['Alt', 'J'],
          title: 'Kelola Menu Santri',
          desc: 'Atur hak akses dan ketersediaan menu yang tampil pada Portal Santri',
          icon: Smartphone,
          action: () => {
            onClose();
            onNavigate('santri_menu');
          }
        },
        {
          keys: [modKey, ','],
          altKeys: ['Alt', ','],
          title: 'Pengaturan Sistem',
          desc: 'Konfigurasi nama perpustakaan, batas pinjam, denda, skema Supabase, dan WhatsApp',
          icon: Settings,
          action: () => {
            onClose();
            onNavigate('settings');
          }
        }
      ]
    },
    {
      category: 'system',
      title: 'Tampilan & Utilitas Staf',
      items: [
        {
          keys: ['Alt', 'M'],
          altKeys: [modKey, 'Shift', 'D'],
          title: 'Ganti Mode Gelap / Terang',
          desc: 'Beralih antara tema gelap (dark mode) dan tema terang (light mode)',
          icon: Moon,
          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900/50',
          action: () => {
            if (onToggleDarkMode) onToggleDarkMode();
          }
        },
        {
          keys: ['Alt', 'V'],
          altKeys: [modKey, 'Shift', 'M'],
          title: 'Mute / Aktifkan Suara Buzzer',
          desc: 'Nyalakan atau bisukan efek suara beep saat kartu RFID berhasil di-tap',
          icon: Volume2,
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50',
          action: () => {
            if (onToggleSound) onToggleSound();
          }
        },
        {
          keys: ['Alt', 'W'],
          title: 'Buka WhatsApp Manager',
          desc: 'Lihat log pesan WhatsApp, status kirim notifikasi peminjaman santri',
          icon: MessageSquare,
          color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50',
          action: () => {
            onClose();
            if (onOpenWhatsApp) onOpenWhatsApp();
          }
        },
        {
          keys: [modKey, '/'],
          altKeys: ['?'],
          title: 'Buka Panduan Pintasan Keyboard',
          desc: 'Menampilkan dialog daftar seluruh tombol pintasan keyboard ini kapan saja',
          icon: HelpCircle,
          color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50',
          action: () => {}
        }
      ]
    }
  ];

  const filteredGroups = shortcutGroups.map(group => {
    if (activeCategory !== 'all' && group.category !== activeCategory) {
      return null;
    }
    const filteredItems = group.items.filter(item => {
      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.keys.join(' ').toLowerCase().includes(q)
      );
    });

    if (filteredItems.length === 0) return null;
    return {
      ...group,
      items: filteredItems
    };
  }).filter(Boolean);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden z-10"
        >
          {/* Header Banner */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20">
                <Keyboard className="w-3.5 h-3.5" />
                <span>Efisiensi Staf Perpustakaan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Pintasan Keyboard (Keyboard Shortcuts)
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl leading-relaxed">
                Akses cepat modul sirkulasi, pencarian santri, presensi, dan fungsi utama tanpa perlu menggerakkan mouse.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter & Category Bar */}
          <div className="p-3 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search filter input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Cari pintasan (misal: sirkulasi)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  activeCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('workflow')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  activeCategory === 'workflow'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Alur Staf
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('navigation')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  activeCategory === 'navigation'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Navigasi
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('system')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  activeCategory === 'system'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Utilitas
              </button>
            </div>
          </div>

          {/* List of shortcuts */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh] space-y-6">
            {filteredGroups.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                Tidak ditemukan pintasan dengan kata kunci &quot;{filterQuery}&quot;.
              </div>
            ) : (
              filteredGroups.map((group, gIdx) => {
                if (!group) return null;
                return (
                  <div key={group.category || gIdx} className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      {group.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {group.items.map((item, idx) => {
                        const Icon = item.icon || Keyboard;
                        return (
                          <div
                            key={idx}
                            onClick={item.action}
                            className="group p-3 rounded-2xl bg-slate-50/70 hover:bg-blue-50/70 dark:bg-slate-800/50 dark:hover:bg-blue-950/30 border border-slate-200/80 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-800/60 transition-all flex items-start justify-between gap-3 cursor-pointer select-none"
                            title="Klik untuk langsung menjalankan pintasan ini"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`p-2 rounded-xl border mt-0.5 shrink-0 ${item.color || 'text-slate-600 bg-white dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            {/* Shortcut Keys Badge */}
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              {item.keys.map((k, kIdx) => (
                                <kbd
                                  key={kIdx}
                                  className="min-w-[22px] px-2 py-1 text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-colors"
                                >
                                  {k}
                                </kbd>
                              ))}
                              {item.altKeys && (
                                <>
                                  <span className="text-[10px] text-slate-400 font-sans">/</span>
                                  {item.altKeys.map((ak, akIdx) => (
                                    <kbd
                                      key={akIdx}
                                      className="min-w-[20px] px-1.5 py-1 text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-300 shadow-2xs"
                                    >
                                      {ak}
                                    </kbd>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3.5 sm:px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Semua pintasan aktif secara global di seluruh halaman sistem.</span>
            </div>
            <div className="text-[11px] flex items-center gap-1">
              <span>Tekan</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                Esc
              </kbd>
              <span>untuk menutup jendela ini</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
