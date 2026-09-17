import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TapPage } from './components/tap/TapPage';
import { CirculationPage } from './components/circulation/CirculationPage';
import { AwardsPage } from './components/awards/AwardsPage';
import { StudentsPage } from './components/students/StudentsPage';
import { CardsPage } from './components/cards/CardsPage';
import { VisitsPage } from './components/visits/VisitsPage';
import { LiveRoomPage } from './components/live/LiveRoomPage';
import { StatsPage } from './components/stats/StatsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { KioskDisplayPage } from './components/kiosk/KioskDisplayPage';
import { UsersPage } from './components/users/UsersPage';
import { UserProfileModal } from './components/users/UserProfileModal';
import { UpdateLogsPage } from './components/updates/UpdateLogsPage';
import { SantriMenuPage } from './components/santri-menu/SantriMenuPage';
import { LoginPage } from './components/auth/LoginPage';
import { SantriDashboard } from './components/santri/SantriDashboard';
import { IdleSessionPrompt } from './components/auth/IdleSessionPrompt';
import { useIdleSessionTimer } from './hooks/useIdleSessionTimer';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

function AppContent() {
  const { 
    isAuthenticated, 
    currentUser, 
    toggleDarkMode, 
    settings, 
    updateSettings, 
    openWhatsAppModal 
  } = useLibrary();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+B, Alt+1..9, Esc, ?, etc.)
  useGlobalShortcuts({
    onNavigate: (tab) => {
      setCurrentTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onOpenSearch: () => setIsCommandPaletteOpen(true),
    onOpenShortcutsModal: () => setIsShortcutsModalOpen(true),
    onCloseModals: () => {
      setIsCommandPaletteOpen(false);
      setIsShortcutsModalOpen(false);
      setIsProfileModalOpen(false);
      setIsMobileSidebarOpen(false);
    },
    onToggleDarkMode: toggleDarkMode,
    onToggleSound: () => updateSettings({ sound_enabled: !settings.sound_enabled }),
    onOpenWhatsApp: openWhatsAppModal,
    onOpenProfile: () => setIsProfileModalOpen(true),
    isSearchOpen: isCommandPaletteOpen,
    isShortcutsModalOpen: isShortcutsModalOpen,
  });

  // Idle session timer for automatic logout at 60 minutes with warning at 50 minutes
  const {
    isWarningOpen,
    remainingSeconds,
    extendSession,
    logoutNow
  } = useIdleSessionTimer();

  // If not logged in, show the Login Page
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // If logged in as Santri, display dedicated Santri Dashboard
  if (currentUser.role === 'SANTRI') {
    return <SantriDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        {/* Top Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        />

        {/* Page Content with Motion Page Transition */}
        <main className={`flex-1 ${currentTab === 'kiosk' ? 'p-3 sm:p-6' : 'pb-24 lg:pb-12'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
              {currentTab === 'tap' && <TapPage onGoToStudents={() => setCurrentTab('students')} />}
              {currentTab === 'circulation' && <CirculationPage />}
              {currentTab === 'awards' && <AwardsPage />}
              {currentTab === 'kiosk' && <KioskDisplayPage onExitKiosk={() => setCurrentTab('dashboard')} />}
              {currentTab === 'students' && <StudentsPage />}
              {currentTab === 'cards' && <CardsPage />}
              {currentTab === 'visits' && <VisitsPage />}
              {currentTab === 'live' && <LiveRoomPage />}
              {currentTab === 'stats' && <StatsPage />}
              {currentTab === 'santri_menu' && <SantriMenuPage />}
              {currentTab === 'users' && <UsersPage />}
              {currentTab === 'updates' && <UpdateLogsPage />}
              {currentTab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Desktop & Kiosk mode) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Global Command Palette Search Modal (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenShortcutsModal={() => {
          setIsCommandPaletteOpen(false);
          setIsShortcutsModalOpen(true);
        }}
        onToggleDarkMode={toggleDarkMode}
        onToggleSound={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
        onOpenWhatsApp={openWhatsAppModal}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal (Ctrl+/ or ?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => {
          setIsShortcutsModalOpen(false);
          setIsCommandPaletteOpen(true);
        }}
        onToggleDarkMode={toggleDarkMode}
        onToggleSound={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
        onOpenWhatsApp={openWhatsAppModal}
      />

      {/* Idle Session Warning Prompt Modal (50 min warning / 60 min auto logout) */}
      <IdleSessionPrompt
        isOpen={isWarningOpen}
        remainingSeconds={remainingSeconds}
        onExtendSession={extendSession}
        onLogout={logoutNow}
      />

      {/* Real-time Network Offline / Online Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <AppContent />
    </LibraryProvider>
  );
}
