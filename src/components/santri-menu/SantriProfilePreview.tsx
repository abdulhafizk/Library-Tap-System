import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  BookOpen, 
  CreditCard, 
  BookMarked, 
  PenTool, 
  Trophy, 
  User, 
  Home,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { resolveMenuIcon } from '../settings/SantriMenuSettingsTab';
import { ProfileViewSkeleton, SyncLoadingOverlay } from './SantriMenuSkeleton';
import { Student, SantriMenuKey, SantriMenu } from '../../types';

interface SantriProfilePreviewProps {
  isSynchronizing: boolean;
  onNavigateToSettings?: () => void;
}

const TOP_7_KEYS: SantriMenuKey[] = [
  'overview',
  'card',
  'visits',
  'loans',
  'journal',
  'awards',
  'profile'
];

export const SantriProfilePreview: React.FC<SantriProfilePreviewProps> = ({
  isSynchronizing,
  onNavigateToSettings
}) => {
  const { santriMenus, students, settings } = useLibrary();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'std-preview'
  );
  const [activePreviewTab, setActivePreviewTab] = useState<SantriMenuKey>('profile');

  // Active student for preview
  const currentStudent: Student = students.find(s => s.id === selectedStudentId) || {
    id: 'std-preview',
    nis: '2026-0891',
    name: 'Muhammad Fatih Al-Faruq',
    class: 'Kelas 3 Aliyah / Asrama Abu Bakar',
    gender: 'L',
    created_at: new Date().toISOString(),
    photo_url: '',
    rfid_uid: 'E280117000000213B'
  };

  // Build top 7 map
  const menuMap = new Map<string, SantriMenu>(santriMenus.map(m => [m.menu_key, m]));

  const top7Items = TOP_7_KEYS.map(key => {
    const existing = menuMap.get(key);
    const defaultName = 
      key === 'overview' ? 'Beranda / Dashboard' :
      key === 'card' ? 'Kartu Anggota Digital' :
      key === 'visits' ? 'Riwayat Kunjungan' :
      key === 'loans' ? 'Peminjaman Saya' :
      key === 'journal' ? 'Catatan Baca & Faedah' :
      key === 'awards' ? 'Lencana & Penghargaan' : 'Profil Santri';

    const defaultIcon = 
      key === 'overview' ? 'Home' :
      key === 'card' ? 'CreditCard' :
      key === 'visits' ? 'Clock' :
      key === 'loans' ? 'BookMarked' :
      key === 'journal' ? 'PenTool' :
      key === 'awards' ? 'Trophy' : 'User';

    return {
      menu_key: key,
      menu_name: existing?.menu_name || defaultName,
      icon: existing?.icon || defaultIcon,
      is_enabled: existing?.is_enabled ?? true,
      description: existing?.description || ''
    };
  });

  return (
    <div className="space-y-6 relative">
      {/* Top Banner with Student Preview Selector & Live Feedback */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Simulasi Pratinjau Tampilan Portal & Profil Santri</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Pratinjau Sinkronisasi Profil Santri
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Tampilan di bawah ini mencerminkan secara persis apa yang dilihat oleh santri pada portal mereka setelah hak akses diatur.
          </p>
        </div>

        {/* Student Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {students.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-2 px-3 text-xs w-full md:w-auto">
              <User className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="flex flex-col flex-1">
                <span className="text-[10px] text-slate-500">Santri yang Ditinjau:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer pr-4"
                >
                  {students.slice(0, 10).map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ubah Pengaturan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Container with Smooth Transitions and Skeleton Loader */}
      <div className="relative min-h-[500px] bg-slate-950/70 border border-slate-800/90 rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Loading Overlay when Synchronizing */}
        <AnimatePresence>
          {isSynchronizing && (
            <SyncLoadingOverlay
              message="Menyinkronkan Pengaturan ke Profil Santri..."
              submessage="Memastikan seluruh 7 menu utama dan kartu fitur di portal santri terbarui secara instan."
              isTransparent={false}
            />
          )}
        </AnimatePresence>

        {isSynchronizing ? (
          <ProfileViewSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 1. Simulated Top 7 Header Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                  Top Header Bar (Tepat 7 Menu Utama Santri)
                </span>
                <span className="text-[11px] text-teal-400 font-mono">
                  {top7Items.filter(t => t.is_enabled).length} Aktif / {top7Items.length} Slot
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2 px-3 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 min-w-max">
                  {top7Items.map(item => {
                    const isCurrent = activePreviewTab === item.menu_key;
                    const isMenuDisabled = !item.is_enabled;

                    return (
                      <button
                        key={item.menu_key}
                        type="button"
                        onClick={() => setActivePreviewTab(item.menu_key)}
                        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCurrent
                            ? isMenuDisabled
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                            : isMenuDisabled
                              ? 'text-slate-500 hover:text-amber-300/80'
                              : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {resolveMenuIcon(item.icon, `w-3.5 h-3.5 ${isMenuDisabled ? 'text-amber-400' : ''}`)}
                        <span className={isMenuDisabled ? 'line-through decoration-amber-500/60 text-slate-400' : ''}>
                          {item.menu_name}
                        </span>

                        {isMenuDisabled && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30">
                            Off
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Simulated Profile View Card */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {currentStudent.photo_url ? (
                  <img
                    src={currentStudent.photo_url}
                    alt={currentStudent.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center border-2 border-emerald-500/50 shadow-xl text-white">
                    <GraduationCap className="w-10 h-10" />
                  </div>
                )}

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {currentStudent.name}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 self-center sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Akun Santri Terverifikasi</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    NIS: <span className="font-mono text-emerald-400 font-bold">{currentStudent.nis}</span> • {currentStudent.class || 'Santri Aktif'}
                  </p>
                </div>
              </div>

              {/* Santri Profile Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block mb-1">Nama Lengkap Santri:</span>
                  <span className="text-white font-medium text-sm">{currentStudent.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Nomor Induk Santri (NIS):</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">{currentStudent.nis}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Kelas / Kamar Asrama:</span>
                  <span className="text-white font-medium text-sm">{currentStudent.class || 'Asrama Santri'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Nomor Kartu RFID Terdaftar:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    {currentStudent.rfid_uid || `RFID-${currentStudent.nis}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Jenis Kelamin:</span>
                  <span className="text-white font-medium text-sm">
                    {currentStudent.gender === 'L' ? 'Laki-laki (Santriwan)' : 'Perempuan (Santriwati)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Status Keanggotaan:</span>
                  <span className="text-emerald-400 font-bold text-sm">Aktif di Sistem</span>
                </div>
              </div>
            </div>

            {/* 3. Live Synchronized Action Cards on Beranda Santri */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold text-slate-300">
                  Kartu Fitur Beranda Santri (Tersinkronisasi Realtime)
                </span>
                <span className="text-[11px] text-slate-500">
                  Total {santriMenus.filter(m => m.menu_key !== 'overview').length} Modul
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {santriMenus
                  .filter(m => m.menu_key !== 'overview' && m.menu_key !== 'notifications')
                  .map(menu => {
                    const isEnabled = menu.is_enabled;

                    return (
                      <div
                        key={menu.menu_key}
                        className={`p-4.5 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between space-y-3 ${
                          isEnabled
                            ? 'bg-slate-900/80 border-slate-800 text-white'
                            : 'bg-slate-950/80 border-amber-500/25 text-slate-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                              isEnabled
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                            }`}>
                              {resolveMenuIcon(menu.icon, 'w-4.5 h-4.5')}
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isEnabled
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1'
                            }`}>
                              {isEnabled ? (
                                'Aktif'
                              ) : (
                                <>
                                  <Clock className="w-2.5 h-2.5" />
                                  Dalam Pengembangan
                                </>
                              )}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-white">
                              {menu.menu_name}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                              {menu.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-mono text-slate-500">
                            {menu.route}
                          </span>
                          <span className={`font-semibold text-xs flex items-center gap-1 ${
                            isEnabled ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {isEnabled ? 'Bisa Diakses' : 'Terkunci'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
