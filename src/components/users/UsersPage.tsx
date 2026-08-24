import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  User, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  UserCheck, 
  Info,
  BadgePercent,
  BookOpenCheck,
  Radio,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { AppUser, UserRole, UserStatus } from '../../types';

// Preset avatar options for convenience
const PRESET_AVATARS = [
  { label: 'Ustadz Pria 1', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Ustadzah Hijab 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Ustadz Pria 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Ustadzah Hijab 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Petugas Muda 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { label: 'Petugas Muda 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
];

export const UsersPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus 
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  // Form State for Add User
  const [newFormData, setNewFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'staff' as UserRole,
    avatar: PRESET_AVATARS[0].url,
    status: 'active' as UserStatus
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Form State for Edit User
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    avatar: '',
    status: 'active' as UserStatus
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Form State for Password Change
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const staffCount = users.filter(u => u.role === 'staff').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  const isAdmin = currentUser?.role === 'admin';

  // Handle Add User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    if (!newFormData.name.trim()) {
      setAddFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!newFormData.username.trim() || newFormData.username.length < 3) {
      setAddFormError('Username minimal 3 karakter tanpa spasi.');
      return;
    }
    if (!newFormData.password || newFormData.password.length < 4) {
      setAddFormError('Kata sandi minimal 4 karakter.');
      return;
    }
    if (newFormData.password !== newFormData.confirmPassword) {
      setAddFormError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const res = addUser({
      name: newFormData.name.trim(),
      username: newFormData.username.trim().toLowerCase(),
      email: newFormData.email.trim() || `${newFormData.username.trim().toLowerCase()}@darululum.sch.id`,
      phone: newFormData.phone.trim(),
      password: newFormData.password,
      role: newFormData.role,
      avatar: newFormData.avatar,
      status: newFormData.status,
    });

    if (res.success) {
      setIsAddModalOpen(false);
      setNewFormData({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'staff',
        avatar: PRESET_AVATARS[0].url,
        status: 'active'
      });
    } else {
      setAddFormError(res.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      avatar: user.avatar,
      status: user.status
    });
    setEditFormError(null);
  };

  // Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError(null);

    if (!editFormData.name.trim()) {
      setEditFormError('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!editFormData.username.trim()) {
      setEditFormError('Username tidak boleh kosong.');
      return;
    }

    const res = updateUser(editingUser.id, {
      name: editFormData.name.trim(),
      username: editFormData.username.trim().toLowerCase(),
      email: editFormData.email.trim(),
      phone: editFormData.phone.trim(),
      role: editFormData.role,
      avatar: editFormData.avatar,
      status: editFormData.status
    });

    if (res.success) {
      setEditingUser(null);
    } else {
      setEditFormError(res.message);
    }
  };

  // Handle Save Password Change
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordUser) return;
    setPasswordError(null);

    if (!newPasswordValue || newPasswordValue.length < 4) {
      setPasswordError('Kata sandi baru minimal 4 karakter.');
      return;
    }
    if (newPasswordValue !== confirmPasswordValue) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const res = updateUser(changingPasswordUser.id, {
      password: newPasswordValue
    });

    if (res.success) {
      setChangingPasswordUser(null);
      setNewPasswordValue('');
      setConfirmPasswordValue('');
    } else {
      setPasswordError(res.message);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id);
    setDeletingUser(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Manajemen Keamanan & Hak Akses
              </span>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  Akses Administrator
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Kelola Pengguna & Akun Petugas
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Administrator utama dapat membuat, mengedit, mengubah password, dan mengatur wewenang akun ustadz/ustadzah staf perpustakaan.
            </p>
          </div>

          {isAdmin && (
            <button
              id="btn-add-new-user"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Akun Baru</span>
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-xs text-slate-400 font-medium">Total Akun</span>
            <div className="text-xl font-bold text-white mt-0.5">{totalUsers}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-xs text-amber-300/80 font-medium">Administrator</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">{adminCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-xs text-emerald-300/80 font-medium">Staff Petugas</span>
            <div className="text-xl font-bold text-emerald-300 mt-0.5">{staffCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-xs text-teal-300/80 font-medium">Akun Aktif</span>
            <div className="text-xl font-bold text-teal-300 mt-0.5">{activeCount}</div>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Anda saat ini login sebagai <strong>Staff Petugas</strong>. Hak akses untuk menambah, menghapus, atau mengubah akun petugas lain hanya dapat dilakukan oleh <strong>Administrator Utama</strong>.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-users"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, username, email, atau no. HP..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  roleFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua Role
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  roleFilter === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Admin ({adminCount})
              </button>
              <button
                onClick={() => setRoleFilter('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  roleFilter === 'staff'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Staff ({staffCount})
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="active">🟢 Status Aktif</option>
              <option value="inactive">🔴 Status Nonaktif</option>
            </select>
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {filteredUsers.map((user) => {
            const isCurrentUser = currentUser?.id === user.id;
            const isDefaultAdmin = user.is_default || user.username === 'admin';

            return (
              <div
                key={user.id}
                id={`card-user-${user.id}`}
                className={`border rounded-3xl p-5 relative transition-all duration-200 flex flex-col justify-between ${
                  isCurrentUser
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {user.role === 'admin' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1">
                          👑 Administrator
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                          👤 Petugas Staff
                        </span>
                      )}

                      {isDefaultAdmin && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800">
                          Bawaan Utama
                        </span>
                      )}

                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Anda Saat Ini
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                      user.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Profile Info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <img
                      src={user.avatar || PRESET_AVATARS[0].url}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                        <span>@{user.username}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="space-y-1.5 py-3 border-y border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    {user.phone && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Phone className="w-3 h-3" /> No. WhatsApp:
                        </span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" /> Login Terakhir:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : 'Belum pernah'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          id={`btn-edit-user-${user.id}`}
                          onClick={() => openEditModal(user)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition-all"
                          title="Edit Info Akun"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          id={`btn-change-pass-${user.id}`}
                          onClick={() => {
                            setChangingPasswordUser(user);
                            setNewPasswordValue('');
                            setConfirmPasswordValue('');
                            setPasswordError(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-1 transition-all"
                          title="Ubah Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Password</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {/* Toggle Status (cannot disable default admin or self) */}
                      {!isDefaultAdmin && !isCurrentUser && (
                        <button
                          id={`btn-toggle-status-${user.id}`}
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-1.5 rounded-xl text-xs font-medium transition-all ${
                            user.status === 'active'
                              ? 'bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-600 hover:text-rose-600'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-200'
                          }`}
                          title={user.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {user.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Delete Button (protected for default admin and self) */}
                      {!isDefaultAdmin && !isCurrentUser && (
                        <button
                          id={`btn-delete-user-${user.id}`}
                          onClick={() => setDeletingUser(user)}
                          className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium transition-all"
                          title="Hapus Akun Petugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tidak ada akun yang sesuai dengan filter
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Coba gunakan kata kunci pencarian yang lain atau reset filter.
            </p>
          </div>
        )}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Matriks Wewenang & Hak Akses Akun Perpustakaan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbedaan wewenang operasional antara Administrator Utama dan Staff Petugas
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Modul & Fitur</th>
                <th className="py-2.5 px-3 font-semibold text-center w-36 text-amber-600 dark:text-amber-400">
                  👑 Administrator
                </th>
                <th className="py-2.5 px-3 font-semibold text-center w-36 text-emerald-600 dark:text-emerald-400">
                  👤 Staff Petugas
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  Kelola Akun & Hak Akses Pengguna
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Check className="w-4 h-4" /> Penuh
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <X className="w-4 h-4" /> Lihat Saja
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-500">Membuat akun ustadz/ustadzah baru & reset password</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-500" />
                  Presensi Tap RFID & QR Code Santri
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                  <Check className="w-4 h-4 inline" /> Aktif
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                  <Check className="w-4 h-4 inline" /> Aktif
                </td>
                <td className="py-2.5 px-3 text-slate-500">Scan kartu masuk/keluar di meja perpustakaan</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                  <BookOpenCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Sirkulasi Peminjaman & Pengembalian Buku
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                  <Check className="w-4 h-4 inline" /> Aktif
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                  <Check className="w-4 h-4 inline" /> Aktif
                </td>
                <td className="py-2.5 px-3 text-slate-500">Catat peminjaman santri, perpanjang, & denda keterlambatan</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                  <BadgePercent className="w-3.5 h-3.5 text-emerald-500" />
                  Gamifikasi & Cetak Piagam Penghargaan
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                  <Check className="w-4 h-4 inline" /> Aktif
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                  <Check className="w-4 h-4 inline" /> Aktif
                </td>
                <td className="py-2.5 px-3 text-slate-500">Memberikan bintang literasi & cetak piagam santri berprestasi</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-emerald-500" />
                  Konfigurasi WhatsApp Gateway & Reset Data
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                  <Check className="w-4 h-4 inline" /> Penuh
                </td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">
                  <X className="w-4 h-4 inline" /> Terkunci
                </td>
                <td className="py-2.5 px-3 text-slate-500">Hanya admin utama yang dapat mengatur token API WA & database</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: TAMBAH AKUN BARU ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <UserPlus className="w-5 h-5" />
                Tambah Akun Petugas Baru
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {addFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Petugas / Ustadz *
                </label>
                <input
                  id="input-new-user-name"
                  type="text"
                  value={newFormData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Auto-suggest username
                    const suggestedUsername = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
                    setNewFormData(prev => ({
                      ...prev,
                      name: val,
                      username: prev.username ? prev.username : suggestedUsername
                    }));
                  }}
                  placeholder="Contoh: Ustadz Ahmad Zaki, S.Pd."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username Login *
                  </label>
                  <input
                    id="input-new-user-username"
                    type="text"
                    value={newFormData.username}
                    onChange={(e) => setNewFormData({ ...newFormData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="ahmadzaki"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peran / Role *
                  </label>
                  <select
                    id="select-new-user-role"
                    value={newFormData.role}
                    onChange={(e) => setNewFormData({ ...newFormData, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="staff">👤 Staff Petugas (Operasional)</option>
                    <option value="admin">👑 Administrator (Akses Penuh)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    id="input-new-user-email"
                    type="email"
                    value={newFormData.email}
                    onChange={(e) => setNewFormData({ ...newFormData, email: e.target.value })}
                    placeholder="zaki@darululum.sch.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    id="input-new-user-phone"
                    type="text"
                    value={newFormData.phone}
                    onChange={(e) => setNewFormData({ ...newFormData, phone: e.target.value })}
                    placeholder="081234567899"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi (Password) *
                  </label>
                  <div className="relative">
                    <input
                      id="input-new-user-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newFormData.password}
                      onChange={(e) => setNewFormData({ ...newFormData, password: e.target.value })}
                      placeholder="Minimal 4 karakter"
                      className="w-full px-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ulangi Kata Sandi *
                  </label>
                  <input
                    id="input-new-user-confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newFormData.confirmPassword}
                    onChange={(e) => setNewFormData({ ...newFormData, confirmPassword: e.target.value })}
                    placeholder="Ketik ulang kata sandi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Foto Profil Petugas
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewFormData({ ...newFormData, avatar: av.url })}
                      className={`relative p-1 rounded-2xl border transition-all text-center ${
                        newFormData.avatar === av.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/50'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover mx-auto"
                      />
                      <span className="block text-[9px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  id="btn-save-new-user"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Simpan & Buat Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT AKUN ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <Edit3 className="w-5 h-5" />
                Edit Akun Petugas: {editingUser.name}
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {editFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Petugas *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peran / Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    disabled={editingUser.is_default}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
                  >
                    <option value="staff">👤 Staff Petugas</option>
                    <option value="admin">👑 Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Akun
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as UserStatus })}
                  disabled={editingUser.is_default || editingUser.id === currentUser?.id}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
                >
                  <option value="active">🟢 Aktif (Dapat Login & Menggunakan Sistem)</option>
                  <option value="inactive">🔴 Nonaktif (Login Diblokir)</option>
                </select>
              </div>

              {/* Preset Avatar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ganti Foto Profil
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, avatar: av.url })}
                      className={`relative p-1 rounded-2xl border transition-all text-center ${
                        editFormData.avatar === av.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/50'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover mx-auto"
                      />
                      <span className="block text-[9px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  id="btn-save-edit-user"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GANTI PASSWORD ================= */}
      {changingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
                <KeyRound className="w-5 h-5" />
                Ubah Password: {changingPasswordUser.username}
              </div>
              <button
                onClick={() => setChangingPasswordUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masukkan kata sandi baru untuk akun <strong>{changingPasswordUser.name}</strong> (@{changingPasswordUser.username}).
            </p>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Baru *
                </label>
                <div className="relative">
                  <input
                    type={showPasswordChange ? 'text' : 'password'}
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full px-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordChange ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <input
                  type={showPasswordChange ? 'text' : 'password'}
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setChangingPasswordUser(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  id="btn-confirm-save-password"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Perbarui Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: HAPUS AKUN ================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 font-bold text-base">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4>Hapus Akun Petugas?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <p>Apakah Anda yakin ingin menghapus akun:</p>
              <div className="font-bold text-slate-900 dark:text-white mt-1">
                {deletingUser.name} (@{deletingUser.username})
              </div>
              <div className="text-slate-500 mt-0.5">{deletingUser.email}</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-user"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
