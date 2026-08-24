import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
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
import { LoginPage } from './components/auth/LoginPage';

function AppContent() {
  const { isAuthenticated, currentUser } = useLibrary();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // If not logged in, show the Login Page
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
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
        />

        {/* Page Content */}
        <main className={`flex-1 ${currentTab === 'kiosk' ? 'p-3 sm:p-6' : 'pb-12'}`}>
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
          {currentTab === 'users' && <UsersPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
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
