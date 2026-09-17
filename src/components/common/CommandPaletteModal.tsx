import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  BookOpen, 
  User, 
  CreditCard, 
  Radio, 
  Sparkles, 
  Moon, 
  Volume2, 
  MessageSquare, 
  Settings, 
  Tv, 
  Trophy, 
  ArrowRight,
  CornerDownLeft,
  LayoutDashboard,
  DoorOpen,
  History,
  Keyboard,
  CheckCircle2,
  Users,
  Smartphone
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { NavTab } from '../layout/Sidebar';
import { Book, Student, RfidCard } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenShortcutsModal: () => void;
  onToggleDarkMode?: () => void;
  onToggleSound?: () => void;
  onOpenWhatsApp?: () => void;
}

type PaletteItem = {
  id: string;
  type: 'action' | 'book' | 'student' | 'card' | 'page';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  shortcut?: string;
  icon: any;
  onSelect: () => void;
};

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenShortcutsModal,
  onToggleDarkMode,
  onToggleSound,
  onOpenWhatsApp
}) => {
  const { books, students, cards, settings, isDarkMode } = useLibrary();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Built-in Actions & Quick Navigation
  const systemActions: PaletteItem[] = useMemo(() => [
    {
      id: 'action-circulation',
      type: 'action',
      title: 'Sirkulasi Peminjaman & Pengembalian Buku',
      subtitle: 'Buka modul peminjaman buku, katalog dan usulan',
      badge: 'Alur Staf',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      shortcut: `${modKey}+B`,
      icon: BookOpen,
      onSelect: () => {
        onClose();
        onNavigate('circulation');
      }
    },
    {
      id: 'action-tap',
      type: 'action',
      title: 'Presensi Tap Kartu RFID / Scanner',
      subtitle: 'Buka meja tap presensi mandiri santri',
      badge: 'Presensi',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      shortcut: 'Alt+T',
      icon: Radio,
      onSelect: () => {
        onClose();
        onNavigate('tap');
      }
    },
    {
      id: 'action-dashboard',
      type: 'page',
      title: 'Dashboard Beranda',
      subtitle: 'Ringkasan statistik perpustakaan',
      shortcut: 'Alt+1',
      icon: LayoutDashboard,
      onSelect: () => {
        onClose();
        onNavigate('dashboard');
      }
    },
    {
      id: 'action-students',
      type: 'page',
      title: 'Data Santri & Siswa',
      subtitle: 'Kelola direktori santri dan NIS',
      shortcut: 'Alt+2',
      icon: Users,
      onSelect: () => {
        onClose();
        onNavigate('students');
      }
    },
    {
      id: 'action-cards',
      type: 'page',
      title: 'Data Kartu RFID',
      subtitle: 'Pendaftaran nomor kartu RFID santri',
      shortcut: 'Alt+3',
      icon: CreditCard,
      onSelect: () => {
        onClose();
        onNavigate('cards');
      }
    },
    {
      id: 'action-visits',
      type: 'page',
      title: 'Riwayat Kunjungan',
      subtitle: 'Log kunjungan presensi masuk & keluar',
      shortcut: 'Alt+4',
      icon: History,
      onSelect: () => {
        onClose();
        onNavigate('visits');
      }
    },
    {
      id: 'action-live',
      type: 'page',
      title: 'Sedang di Perpustakaan (Live Room)',
      subtitle: 'Daftar santri aktif di ruang baca',
      shortcut: 'Alt+5',
      icon: DoorOpen,
      onSelect: () => {
        onClose();
        onNavigate('live');
      }
    },
    {
      id: 'action-awards',
      type: 'page',
      title: 'Penghargaan & XP Literasi',
      subtitle: 'Piagam dan poin keaktifan santri',
      shortcut: 'Alt+6',
      icon: Trophy,
      onSelect: () => {
        onClose();
        onNavigate('awards');
      }
    },
    {
      id: 'action-kiosk',
      type: 'page',
      title: 'Mode Display Kios TV',
      subtitle: 'Tampilan layar lebar TV aula perpustakaan',
      shortcut: 'Alt+8',
      icon: Tv,
      onSelect: () => {
        onClose();
        onNavigate('kiosk');
      }
    },
    {
      id: 'action-santri-menu',
      type: 'page',
      title: 'Kelola Menu Portal Santri',
      subtitle: 'Atur hak akses dan ketersediaan menu dashboard santri',
      badge: 'Portal Santri',
      badgeColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
      shortcut: 'Alt+7',
      icon: Smartphone,
      onSelect: () => {
        onClose();
        onNavigate('santri_menu');
      }
    },
    {
      id: 'action-settings',
      type: 'page',
      title: 'Pengaturan Sistem Perpustakaan',
      subtitle: 'Aturan denda, batas pinjam, skema Supabase, WhatsApp',
      shortcut: `${modKey}+,`,
      icon: Settings,
      onSelect: () => {
        onClose();
        onNavigate('settings');
      }
    },
    {
      id: 'action-toggle-dark',
      type: 'action',
      title: isDarkMode ? 'Beralih ke Tema Terang (Light Mode)' : 'Beralih ke Tema Gelap (Dark Mode)',
      subtitle: 'Ubah tampilan visual antarmuka',
      shortcut: 'Alt+M',
      icon: Moon,
      onSelect: () => {
        if (onToggleDarkMode) onToggleDarkMode();
      }
    },
    {
      id: 'action-toggle-sound',
      type: 'action',
      title: settings.sound_enabled ? 'Bisukan Efek Suara (Mute Beep)' : 'Aktifkan Efek Suara (Unmute)',
      subtitle: 'Kontrol audio buzzer alert tap RFID',
      shortcut: 'Alt+V',
      icon: Volume2,
      onSelect: () => {
        if (onToggleSound) onToggleSound();
      }
    },
    {
      id: 'action-whatsapp',
      type: 'action',
      title: 'Buka WhatsApp Notifikasi & Log',
      subtitle: 'Status pengiriman pesan peminjaman',
      shortcut: 'Alt+W',
      icon: MessageSquare,
      onSelect: () => {
        onClose();
        if (onOpenWhatsApp) onOpenWhatsApp();
      }
    },
    {
      id: 'action-shortcuts',
      type: 'action',
      title: 'Lihat Seluruh Pintasan Keyboard (Cheat Sheet)',
      subtitle: 'Daftar lengkap tombol pintasan sistem',
      shortcut: `${modKey}+/`,
      icon: Keyboard,
      onSelect: () => {
        onClose();
        onOpenShortcutsModal();
      }
    }
  ], [modKey, onClose, onNavigate, onOpenShortcutsModal, onToggleDarkMode, onToggleSound, onOpenWhatsApp, isDarkMode, settings.sound_enabled]);

  // Filtered items based on query
  const filteredItems: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    // If query is empty, show default quick actions & navigation
    if (!q) {
      return systemActions;
    }

    const results: PaletteItem[] = [];

    // 1. Matched System Actions
    const matchedActions = systemActions.filter(a => 
      a.title.toLowerCase().includes(q) ||
      (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
      (a.shortcut && a.shortcut.toLowerCase().includes(q))
    );
    results.push(...matchedActions);

    // 2. Search Books (Koleksi Buku / Kitab)
    const matchedBooks = books.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.toLowerCase().includes(q)) ||
      (b.rack_location && b.rack_location.toLowerCase().includes(q))
    ).slice(0, 5).map(b => ({
      id: `book-${b.id}`,
      type: 'book' as const,
      title: b.title,
      subtitle: `${b.author} • ${b.category} • Rak: ${b.rack_location}`,
      badge: `Stok: ${b.available_stock}/${b.total_stock}`,
      badgeColor: b.available_stock > 0 
        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      shortcut: b.code,
      icon: BookOpen,
      onSelect: () => {
        onClose();
        onNavigate('circulation');
      }
    }));
    results.push(...matchedBooks);

    // 3. Search Students (Santri / Siswa)
    const matchedStudents = students.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      s.class.toLowerCase().includes(q) ||
      (s.rfid_uid && s.rfid_uid.toLowerCase().includes(q))
    ).slice(0, 5).map(s => ({
      id: `student-${s.id}`,
      type: 'student' as const,
      title: s.name,
      subtitle: `NIS: ${s.nis} • Kelas ${s.class} • ${s.rfid_uid ? `UID: ${s.rfid_uid}` : 'Belum ada kartu'}`,
      badge: s.status === 'active' ? 'Santri Aktif' : s.status,
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      shortcut: s.nis,
      icon: User,
      onSelect: () => {
        onClose();
        onNavigate('students');
      }
    }));
    results.push(...matchedStudents);

    // 4. Search RFID Cards
    const matchedCards = cards.filter(c => 
      c.uid.toLowerCase().includes(q) ||
      (c.note && c.note.toLowerCase().includes(q))
    ).slice(0, 3).map(c => ({
      id: `card-${c.id}`,
      type: 'card' as const,
      title: `Kartu RFID: ${c.uid}`,
      subtitle: c.note || 'Kartu akses perpustakaan',
      badge: c.status.toUpperCase(),
      badgeColor: c.status === 'active'
        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      shortcut: c.uid,
      icon: CreditCard,
      onSelect: () => {
        onClose();
        onNavigate('cards');
      }
    }));
    results.push(...matchedCards);

    return results;
  }, [query, systemActions, books, students, cards, onClose, onNavigate]);

  // Adjust selected index when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.onSelect();
      }
    }
  };

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs cursor-pointer"
        />

        {/* Spotlight Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl overflow-hidden z-10 flex flex-col max-h-[82vh]"
        >
          {/* Top Search Input Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari santri, judul buku, kode, NIS, atau ketik aksi..."
              className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Hapus ketikan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                Esc
              </kbd>
            </div>
          </div>

          {/* Results List */}
          <div 
            ref={listRef} 
            className="p-2 sm:p-3 overflow-y-auto max-h-[50vh] space-y-1"
          >
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                <p className="text-sm font-medium">Tidak ada hasil yang cocok dengan &quot;{query}&quot;</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Coba kata kunci nama santri, NIS, judul buku, kode buku, atau nama menu.
                </p>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={item.onSelect}
                    className={`p-3 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold truncate leading-tight">
                            {item.title}
                          </p>
                          {item.badge && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className={`text-[11px] truncate leading-tight ${isSelected ? 'text-blue-700/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Shortcut / Action Hint */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.shortcut && (
                        <kbd className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold shadow-2xs ${
                          isSelected 
                            ? 'bg-blue-100/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {item.shortcut}
                        </kbd>
                      )}
                      {isSelected && (
                        <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          <span>Pilih</span>
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Helpful Navigation Guide */}
          <div className="p-3 sm:px-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↓</kbd>
                <span className="text-[11px]">navigasi</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↵</kbd>
                <span className="text-[11px]">buka</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShortcutsModal();
              }}
              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-[11px]"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Semua Pintasan Keyboard ({modKey}+/)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
