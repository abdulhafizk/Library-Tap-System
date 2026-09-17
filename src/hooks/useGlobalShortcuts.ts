import { useEffect, useCallback } from 'react';
import { NavTab } from '../components/layout/Sidebar';

export interface ShortcutItem {
  id: string;
  category: 'workflow' | 'navigation' | 'system';
  keys: string[];
  keyDisplay: string;
  label: string;
  description: string;
  action: () => void;
}

interface UseGlobalShortcutsOptions {
  onNavigate: (tab: NavTab) => void;
  onOpenSearch: () => void;
  onOpenShortcutsModal: () => void;
  onCloseModals: () => void;
  onToggleDarkMode?: () => void;
  onToggleSound?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenProfile?: () => void;
  isSearchOpen?: boolean;
  isShortcutsModalOpen?: boolean;
}

/**
 * Global Keyboard Shortcuts Hook for Library Tap System.
 * Enables quick workflows for staff:
 * - Ctrl+K: Quick search / command palette
 * - Ctrl+B: Peminjaman & sirkulasi buku (Circulation)
 * - Alt+T / Ctrl+Shift+T: Presensi Tap RFID / scanner
 * - Alt+1..9: Navigasi cepat modul utama
 * - Ctrl+/ or ?: Daftar semua pintasan (Cheat Sheet)
 * - Alt+M: Toggle Dark/Light mode
 * - Alt+V: Toggle Suara alert buzzer
 * - Alt+W: Buka WhatsApp modal
 * - Escape: Tutup modal aktif
 */
export const useGlobalShortcuts = ({
  onNavigate,
  onOpenSearch,
  onOpenShortcutsModal,
  onCloseModals,
  onToggleDarkMode,
  onToggleSound,
  onOpenWhatsApp,
  onOpenProfile,
  isSearchOpen = false,
  isShortcutsModalOpen = false,
}: UseGlobalShortcutsOptions) => {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
    const isAlt = event.altKey;
    const isShift = event.shiftKey;
    const key = event.key;

    // Check if the user is typing in an editable field
    const activeElement = document.activeElement;
    const isInputField = activeElement instanceof HTMLInputElement || 
                          activeElement instanceof HTMLTextAreaElement || 
                          activeElement instanceof HTMLSelectElement ||
                          (activeElement as HTMLElement)?.isContentEditable;

    // 1. ESCAPE: Always closes open modals
    if (key === 'Escape') {
      onCloseModals();
      return;
    }

    // 2. CTRL+K or CMD+K: Global Search / Command Palette
    if (isCmdOrCtrl && (key.toLowerCase() === 'k')) {
      event.preventDefault();
      event.stopPropagation();
      onOpenSearch();
      return;
    }

    // 3. CTRL+B or CMD+B: Circulation / Sirkulasi Peminjaman & Buku
    if (isCmdOrCtrl && (key.toLowerCase() === 'b')) {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('circulation');
      return;
    }

    // 4. SHORTCUT CHEAT SHEET: Ctrl+/ or Cmd+/ or F1
    if ((isCmdOrCtrl && key === '/') || key === 'F1') {
      event.preventDefault();
      event.stopPropagation();
      onOpenShortcutsModal();
      return;
    }

    // 5. CTRL+SHIFT+T or ALT+T: Tap RFID Presensi
    if ((isCmdOrCtrl && isShift && key.toLowerCase() === 't') || (isAlt && key.toLowerCase() === 't')) {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('tap');
      return;
    }

    // 6. CTRL+SHIFT+D or ALT+M: Toggle Dark/Light Mode
    if ((isCmdOrCtrl && isShift && key.toLowerCase() === 'd') || (isAlt && key.toLowerCase() === 'm')) {
      event.preventDefault();
      event.stopPropagation();
      if (onToggleDarkMode) onToggleDarkMode();
      return;
    }

    // 7. ALT+V or CTRL+SHIFT+M: Toggle Sound/Mute
    if ((isAlt && key.toLowerCase() === 'v') || (isCmdOrCtrl && isShift && key.toLowerCase() === 'm')) {
      event.preventDefault();
      event.stopPropagation();
      if (onToggleSound) onToggleSound();
      return;
    }

    // 8. ALT+W: WhatsApp Manager
    if (isAlt && key.toLowerCase() === 'w') {
      event.preventDefault();
      event.stopPropagation();
      if (onOpenWhatsApp) onOpenWhatsApp();
      return;
    }

    // 9. ALT+P: Penghargaan & XP Literasi
    if (isAlt && key.toLowerCase() === 'p') {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('awards');
      return;
    }

    // 10. ALT+K or CTRL+SHIFT+K: Kios Display TV
    if ((isAlt && key.toLowerCase() === 'k') || (isCmdOrCtrl && isShift && key.toLowerCase() === 'k')) {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('kiosk');
      return;
    }

    // 11. ALT+S: Data Santri
    if (isAlt && key.toLowerCase() === 's') {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('students');
      return;
    }

    // 12. ALT+C: Data Kartu RFID
    if (isAlt && key.toLowerCase() === 'c') {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('cards');
      return;
    }

    // 13. ALT+R: Riwayat Kunjungan
    if (isAlt && key.toLowerCase() === 'r') {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('visits');
      return;
    }

    // 14. ALT+L: Sedang di Perpustakaan (Live Room)
    if (isAlt && key.toLowerCase() === 'l') {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('live');
      return;
    }

    // 15. ALT+U: Update Log Aplikasi
    if (isAlt && key.toLowerCase() === 'u') {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('updates');
      return;
    }

    // 16. ALT+J: Kelola Menu Portal Santri
    if (isAlt && key.toLowerCase() === 'j') {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('santri_menu');
      return;
    }

    // 17. CTRL+, or ALT+, : Pengaturan Sistem
    if ((isCmdOrCtrl && key === ',') || (isAlt && key === ',')) {
      event.preventDefault();
      event.stopPropagation();
      onNavigate('settings');
      return;
    }

    // 17. Number Keys with Alt (Alt+1 through Alt+9): Quick Jump to Main Menus
    if (isAlt && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      const tabMap: Record<string, NavTab> = {
        '1': 'dashboard',
        '2': 'tap',
        '3': 'circulation',
        '4': 'students',
        '5': 'cards',
        '6': 'visits',
        '7': 'live',
        '8': 'awards',
        '9': 'settings'
      };
      const target = tabMap[key];
      if (target) {
        onNavigate(target);
      }
      return;
    }

    // 18. Non-input single key shortcuts
    if (!isInputField && !isCmdOrCtrl && !isAlt) {
      // Question mark (?) opens shortcuts cheat sheet
      if (key === '?') {
        event.preventDefault();
        onOpenShortcutsModal();
        return;
      }
      // Slash (/) opens search if search modal isn't already open
      if (key === '/' && !isSearchOpen && !isShortcutsModalOpen) {
        event.preventDefault();
        onOpenSearch();
        return;
      }
    }
  }, [
    onNavigate,
    onOpenSearch,
    onOpenShortcutsModal,
    onCloseModals,
    onToggleDarkMode,
    onToggleSound,
    onOpenWhatsApp,
    isSearchOpen,
    isShortcutsModalOpen
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
