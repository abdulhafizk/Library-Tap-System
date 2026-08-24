import { Student, RfidCard, LibraryVisit, AppUser, LibrarySettings, NotificationItem, Book, BookLoan } from '../types';
import { defaultWhatsAppConfig } from '../utils/whatsappUtils';

export const initialUsers: AppUser[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Ustadz Abdullah Hafiz, M.Pd.',
    email: 'admin@darululum.sch.id',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '081234567890',
    status: 'active',
    is_default: true,
    created_at: '2024-01-10T08:00:00Z',
    last_login: new Date().toISOString()
  },
  {
    id: 'usr-staff-1',
    username: 'fatimah',
    name: 'Ustadzah Siti Fatimah, S.I.Pust.',
    email: 'fatimah.pustaka@darululum.sch.id',
    password: 'staff123',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '081234567891',
    status: 'active',
    is_default: false,
    created_at: '2024-02-01T08:00:00Z',
    last_login: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const initialSettings: LibrarySettings = {
  library_name: 'Perpustakaan Baitul Hikmah',
  institution_name: 'Pondok Pesantren Darul Ulum Modern',
  open_time: '07:30',
  close_time: '17:30',
  max_visit_minutes: 180,
  capacity: 75,
  sound_enabled: true,
  dark_mode: false,
  auto_reset_seconds: 4,
  kiosk_mode_allowed: true,
  whatsapp: defaultWhatsAppConfig,
};

export const initialStudents: Student[] = [
  {
    id: 'std-001',
    nis: '202407001',
    name: 'Ahmad Fauzan Al-Faruq',
    class: '10 IPA 1',
    gender: 'L',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    rfid_uid: 'E28068940001',
    status: 'active',
    phone: '081234567890',
    created_at: '2024-07-01T08:00:00Z'
  },
  {
    id: 'std-002',
    nis: '202407002',
    name: 'Muhammad Rizky Pratama',
    class: '10 IPA 1',
    gender: 'L',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '5A7B3901A002',
    status: 'active',
    phone: '081234567891',
    created_at: '2024-07-01T08:00:00Z'
  },
  {
    id: 'std-003',
    nis: '202407003',
    name: 'Aisyah Putri Rahmadhani',
    class: '11 IPA 2',
    gender: 'P',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '90DF32A1C003',
    status: 'active',
    phone: '081234567892',
    created_at: '2024-07-01T08:00:00Z'
  },
  {
    id: 'std-004',
    nis: '202407004',
    name: 'Fathir Zaidan Al-Ghifari',
    class: '9A',
    gender: 'L',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    rfid_uid: 'B412089FE004',
    status: 'active',
    phone: '081234567893',
    created_at: '2024-07-01T08:00:00Z'
  },
  {
    id: 'std-005',
    nis: '202407005',
    name: 'Nabila Zahra Khairunnisa',
    class: '9B',
    gender: 'P',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '38C91A0BF005',
    status: 'active',
    phone: '081234567894',
    created_at: '2024-07-01T08:00:00Z'
  },
  {
    id: 'std-006',
    nis: '202407006',
    name: 'Daffa Raihan Al-Mubarak',
    class: '8A',
    gender: 'L',
    photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '74D90E341006',
    status: 'active',
    phone: '081234567895',
    created_at: '2024-07-02T08:00:00Z'
  },
  {
    id: 'std-007',
    nis: '202407007',
    name: 'Siti Nurhaliza Azzahra',
    class: '10 IPS 1',
    gender: 'P',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '11AA89F32007',
    status: 'active',
    phone: '081234567896',
    created_at: '2024-07-02T08:00:00Z'
  },
  {
    id: 'std-008',
    nis: '202407008',
    name: 'Ibrahim Malik Syahputra',
    class: '7A',
    gender: 'L',
    photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '990B22C47008',
    status: 'active',
    phone: '081234567897',
    created_at: '2024-07-02T08:00:00Z'
  },
  {
    id: 'std-009',
    nis: '202407009',
    name: 'Hafizhah Khansa Maritza',
    class: '12 IPA 1',
    gender: 'P',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '45FF98239009',
    status: 'active',
    phone: '081234567898',
    created_at: '2024-07-03T08:00:00Z'
  },
  {
    id: 'std-010',
    nis: '202407010',
    name: 'Bilal Hidayatullah',
    class: '8B',
    gender: 'L',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '23CC81744010',
    status: 'active',
    phone: '081234567899',
    created_at: '2024-07-03T08:00:00Z'
  },
  {
    id: 'std-011',
    nis: '202407011',
    name: 'Zulfa Nayla Salsabila',
    class: '7B',
    gender: 'P',
    photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    rfid_uid: '88AE92B10011',
    status: 'active',
    phone: '081234567810',
    created_at: '2024-07-04T08:00:00Z'
  },
  {
    id: 'std-012',
    nis: '202407012',
    name: 'Rafi Ardiansyah Pratama',
    class: '11 IPS 1',
    gender: 'L',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    rfid_uid: undefined,
    status: 'active',
    phone: '081234567811',
    created_at: '2024-07-04T08:00:00Z'
  }
];

export const initialCards: RfidCard[] = [
  { id: 'c-01', uid: 'E28068940001', student_id: 'std-001', status: 'active', registered_at: '2024-07-01T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-02', uid: '5A7B3901A002', student_id: 'std-002', status: 'active', registered_at: '2024-07-01T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-03', uid: '90DF32A1C003', student_id: 'std-003', status: 'active', registered_at: '2024-07-01T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-04', uid: 'B412089FE004', student_id: 'std-004', status: 'active', registered_at: '2024-07-01T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-05', uid: '38C91A0BF005', student_id: 'std-005', status: 'active', registered_at: '2024-07-01T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-06', uid: '74D90E341006', student_id: 'std-006', status: 'active', registered_at: '2024-07-02T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-07', uid: '11AA89F32007', student_id: 'std-007', status: 'active', registered_at: '2024-07-02T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-08', uid: '990B22C47008', student_id: 'std-008', status: 'active', registered_at: '2024-07-02T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-09', uid: '45FF98239009', student_id: 'std-009', status: 'active', registered_at: '2024-07-03T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-10', uid: '23CC81744010', student_id: 'std-010', status: 'active', registered_at: '2024-07-03T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-11', uid: '88AE92B10011', student_id: 'std-011', status: 'active', registered_at: '2024-07-04T08:30:00Z', note: 'Kartu Mifare 1K Santri' },
  { id: 'c-12', uid: '99FFAA220012', student_id: null, status: 'active', registered_at: '2024-07-05T08:30:00Z', note: 'Kartu Baru Cadangan (Belum Terhubung)' },
  { id: 'c-13', uid: '44BBDD880013', student_id: null, status: 'active', registered_at: '2024-07-05T08:30:00Z', note: 'Kartu Baru Cadangan (Belum Terhubung)' },
  { id: 'c-14', uid: '123456789ABC', student_id: null, status: 'inactive', registered_at: '2024-06-20T08:30:00Z', note: 'Kartu Rusak / Nonaktif' }
];

// Helper to generate dynamic dates relative to today
const now = new Date();
const getPastDate = (daysAgo: number, hour = 9, minute = 30) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const initialVisits: LibraryVisit[] = [
  // Active visits (Students currently inside the library)
  {
    id: 'v-act-1',
    student_id: 'std-001',
    rfid_card_id: 'c-01',
    rfid_uid: 'E28068940001',
    check_in: new Date(now.getTime() - 48 * 60 * 1000).toISOString(), // 48 mins ago
    check_out: null,
    duration_minutes: null,
    status: 'inside',
    created_at: new Date(now.getTime() - 48 * 60 * 1000).toISOString(),
  },
  {
    id: 'v-act-2',
    student_id: 'std-003',
    rfid_card_id: 'c-03',
    rfid_uid: '90DF32A1C003',
    check_in: new Date(now.getTime() - 95 * 60 * 1000).toISOString(), // 1h 35m ago
    check_out: null,
    duration_minutes: null,
    status: 'inside',
    created_at: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
  },
  {
    id: 'v-act-3',
    student_id: 'std-006',
    rfid_card_id: 'c-06',
    rfid_uid: '74D90E341006',
    check_in: new Date(now.getTime() - 22 * 60 * 1000).toISOString(), // 22 mins ago
    check_out: null,
    duration_minutes: null,
    status: 'inside',
    created_at: new Date(now.getTime() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'v-act-4',
    student_id: 'std-008',
    rfid_card_id: 'c-08',
    rfid_uid: '990B22C47008',
    check_in: new Date(now.getTime() - 11 * 60 * 1000).toISOString(), // 11 mins ago
    check_out: null,
    duration_minutes: null,
    status: 'inside',
    created_at: new Date(now.getTime() - 11 * 60 * 1000).toISOString(),
  },

  // Completed visits today
  {
    id: 'v-tod-1',
    student_id: 'std-002',
    rfid_card_id: 'c-02',
    rfid_uid: '5A7B3901A002',
    check_in: getPastDate(0, 8, 15),
    check_out: getPastDate(0, 9, 45),
    duration_minutes: 90,
    status: 'completed',
    created_at: getPastDate(0, 8, 15),
  },
  {
    id: 'v-tod-2',
    student_id: 'std-004',
    rfid_card_id: 'c-04',
    rfid_uid: 'B412089FE004',
    check_in: getPastDate(0, 9, 0),
    check_out: getPastDate(0, 10, 15),
    duration_minutes: 75,
    status: 'completed',
    created_at: getPastDate(0, 9, 0),
  },
  {
    id: 'v-tod-3',
    student_id: 'std-005',
    rfid_card_id: 'c-05',
    rfid_uid: '38C91A0BF005',
    check_in: getPastDate(0, 10, 30),
    check_out: getPastDate(0, 11, 20),
    duration_minutes: 50,
    status: 'completed',
    created_at: getPastDate(0, 10, 30),
  },
  {
    id: 'v-tod-4',
    student_id: 'std-007',
    rfid_card_id: 'c-07',
    rfid_uid: '11AA89F32007',
    check_in: getPastDate(0, 11, 0),
    check_out: getPastDate(0, 12, 10),
    duration_minutes: 70,
    status: 'completed',
    created_at: getPastDate(0, 11, 0),
  },

  // Past days visits
  {
    id: 'v-hist-1',
    student_id: 'std-001',
    rfid_card_id: 'c-01',
    rfid_uid: 'E28068940001',
    check_in: getPastDate(1, 13, 0),
    check_out: getPastDate(1, 15, 30),
    duration_minutes: 150,
    status: 'completed',
    created_at: getPastDate(1, 13, 0),
  },
  {
    id: 'v-hist-2',
    student_id: 'std-003',
    rfid_card_id: 'c-03',
    rfid_uid: '90DF32A1C003',
    check_in: getPastDate(1, 14, 10),
    check_out: getPastDate(1, 16, 0),
    duration_minutes: 110,
    status: 'completed',
    created_at: getPastDate(1, 14, 10),
  },
  {
    id: 'v-hist-3',
    student_id: 'std-009',
    rfid_card_id: 'c-09',
    rfid_uid: '45FF98239009',
    check_in: getPastDate(1, 9, 30),
    check_out: getPastDate(1, 11, 30),
    duration_minutes: 120,
    status: 'completed',
    created_at: getPastDate(1, 9, 30),
  },
  {
    id: 'v-hist-4',
    student_id: 'std-010',
    rfid_card_id: 'c-10',
    rfid_uid: '23CC81744010',
    check_in: getPastDate(2, 8, 45),
    check_out: getPastDate(2, 10, 15),
    duration_minutes: 90,
    status: 'completed',
    created_at: getPastDate(2, 8, 45),
  },
  {
    id: 'v-hist-5',
    student_id: 'std-011',
    rfid_card_id: 'c-11',
    rfid_uid: '88AE92B10011',
    check_in: getPastDate(2, 13, 15),
    check_out: getPastDate(2, 14, 45),
    duration_minutes: 90,
    status: 'completed',
    created_at: getPastDate(2, 13, 15),
  },
  {
    id: 'v-hist-6',
    student_id: 'std-001',
    rfid_card_id: 'c-01',
    rfid_uid: 'E28068940001',
    check_in: getPastDate(3, 9, 0),
    check_out: getPastDate(3, 11, 0),
    duration_minutes: 120,
    status: 'completed',
    created_at: getPastDate(3, 9, 0),
  },
  {
    id: 'v-hist-7',
    student_id: 'std-004',
    rfid_card_id: 'c-04',
    rfid_uid: 'B412089FE004',
    check_in: getPastDate(3, 14, 0),
    check_out: getPastDate(3, 15, 30),
    duration_minutes: 90,
    status: 'completed',
    created_at: getPastDate(3, 14, 0),
  },
  {
    id: 'v-hist-8',
    student_id: 'std-002',
    rfid_card_id: 'c-02',
    rfid_uid: '5A7B3901A002',
    check_in: getPastDate(4, 10, 0),
    check_out: getPastDate(4, 11, 45),
    duration_minutes: 105,
    status: 'completed',
    created_at: getPastDate(4, 10, 0),
  },
  {
    id: 'v-hist-9',
    student_id: 'std-007',
    rfid_card_id: 'c-07',
    rfid_uid: '11AA89F32007',
    check_in: getPastDate(4, 13, 30),
    check_out: getPastDate(4, 15, 0),
    duration_minutes: 90,
    status: 'completed',
    created_at: getPastDate(4, 13, 30),
  },
  {
    id: 'v-hist-10',
    student_id: 'std-005',
    rfid_card_id: 'c-05',
    rfid_uid: '38C91A0BF005',
    check_in: getPastDate(5, 8, 30),
    check_out: getPastDate(5, 10, 0),
    duration_minutes: 90,
    status: 'completed',
    created_at: getPastDate(5, 8, 30),
  },
  {
    id: 'v-hist-11',
    student_id: 'std-003',
    rfid_card_id: 'c-03',
    rfid_uid: '90DF32A1C003',
    check_in: getPastDate(5, 14, 0),
    check_out: getPastDate(5, 16, 30),
    duration_minutes: 150,
    status: 'completed',
    created_at: getPastDate(5, 14, 0),
  },
  {
    id: 'v-hist-12',
    student_id: 'std-009',
    rfid_card_id: 'c-09',
    rfid_uid: '45FF98239009',
    check_in: getPastDate(6, 9, 15),
    check_out: getPastDate(6, 11, 45),
    duration_minutes: 150,
    status: 'completed',
    created_at: getPastDate(6, 9, 15),
  },
  {
    id: 'v-hist-13',
    student_id: 'std-008',
    rfid_card_id: 'c-08',
    rfid_uid: '990B22C47008',
    check_in: getPastDate(6, 13, 0),
    check_out: getPastDate(6, 14, 15),
    duration_minutes: 75,
    status: 'completed',
    created_at: getPastDate(6, 13, 0),
  }
];

export const initialBooks: Book[] = [
  {
    id: 'bk-001',
    code: 'KTB-FIQ-001',
    title: 'Fathul Qorib Al-Mujib (Fiqh Syafi\'i)',
    author: 'Syaikh Muhammad bin Qasim Al-Ghazi',
    publisher: 'Darul Kutub Al-Islamiyah',
    year: 2020,
    category: 'Fikih & Ushul',
    rack_location: 'Rak A-01 (Kitab Kuning)',
    total_stock: 8,
    available_stock: 6,
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
    isbn: '978-979-3001-21-4',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: 'bk-002',
    code: 'KTB-HDT-002',
    title: 'Riyadhus Shalihin (Taman Orang-Orang Shalih)',
    author: 'Imam An-Nawawi',
    publisher: 'Pustaka Amani',
    year: 2021,
    category: 'Hadits',
    rack_location: 'Rak A-02 (Hadits)',
    total_stock: 6,
    available_stock: 4,
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80',
    isbn: '978-979-3002-33-7',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: 'bk-003',
    code: 'KTB-TFS-003',
    title: 'Tafsir Jalalain (2 Jilid Lengkap)',
    author: 'Jalaluddin Al-Mahalli & Jalaluddin As-Suyuthi',
    publisher: 'Al-Haramain',
    year: 2019,
    category: 'Tafsir & Al-Qur\'an',
    rack_location: 'Rak A-03 (Tafsir)',
    total_stock: 5,
    available_stock: 4,
    cover_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=300&auto=format&fit=crop&q=80',
    isbn: '978-979-3003-45-0',
    created_at: '2024-01-16T08:00:00Z'
  },
  {
    id: 'bk-004',
    code: 'KTB-BHS-004',
    title: 'Matan Al-Ajurrumiyyah fi \'Ilmin Nahwi',
    author: 'Abu Abdillah Muhammad bin Dawud Ash-Shanhaji',
    publisher: 'Maktabah Toha Putra',
    year: 2022,
    category: 'Bahasa & Nahwu',
    rack_location: 'Rak B-01 (Nahwu & Sharaf)',
    total_stock: 12,
    available_stock: 9,
    cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80',
    isbn: '978-979-3004-56-1',
    created_at: '2024-01-16T08:00:00Z'
  },
  {
    id: 'bk-005',
    code: 'KTB-TRK-005',
    title: 'Ar-Rahiq Al-Makhtum (Sirah Nabawiyah)',
    author: 'Syaikh Shafiyyurrahman Al-Mubarakfuri',
    publisher: 'Ummul Qura',
    year: 2021,
    category: 'Sejarah Islam / Tarikh',
    rack_location: 'Rak B-02 (Sirah & Tarikh)',
    total_stock: 7,
    available_stock: 5,
    cover_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&auto=format&fit=crop&q=80',
    isbn: '978-602-7637-12-8',
    created_at: '2024-01-18T08:00:00Z'
  },
  {
    id: 'bk-006',
    code: 'KTB-AKH-006',
    title: 'Ta\'limul Muta\'allim Thariqat Ta\'allum',
    author: 'Syaikh Az-Zarnuji',
    publisher: 'Al-Hidayah',
    year: 2020,
    category: 'Akhlak & Tasawuf',
    rack_location: 'Rak B-03 (Adab Santri)',
    total_stock: 10,
    available_stock: 8,
    cover_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&auto=format&fit=crop&q=80',
    isbn: '978-979-3006-89-2',
    created_at: '2024-01-20T08:00:00Z'
  },
  {
    id: 'bk-007',
    code: 'BK-UMM-007',
    title: 'Ensiklopedia Sains Islami: Penemuan Muslim yang Mengubah Dunia',
    author: 'Prof. Salim T. S. Al-Hassani',
    publisher: 'Gramedia Pustaka Utama',
    year: 2022,
    category: 'Buku Umum & Sains',
    rack_location: 'Rak C-01 (Sains & Umum)',
    total_stock: 4,
    available_stock: 3,
    cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&auto=format&fit=crop&q=80',
    isbn: '978-602-03-8822-1',
    created_at: '2024-02-01T08:00:00Z'
  },
  {
    id: 'bk-008',
    code: 'BK-NVL-008',
    title: 'Negeri 5 Menara (Edisi Khusus Pesantren)',
    author: 'A. Fuadi',
    publisher: 'Gramedia',
    year: 2021,
    category: 'Novel & Sastra',
    rack_location: 'Rak C-02 (Novel & Inspirasi)',
    total_stock: 5,
    available_stock: 4,
    cover_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&auto=format&fit=crop&q=80',
    isbn: '978-979-22-4861-6',
    created_at: '2024-02-05T08:00:00Z'
  }
];

export const initialLoans: BookLoan[] = [
  {
    id: 'loan-001',
    loan_code: 'PJM-20260814-001',
    student_id: 'std-001',
    book_id: 'bk-001',
    borrow_date: getPastDate(7, 10, 0),
    due_date: getPastDate(0, 17, 0), // Today due
    return_date: null,
    status: 'borrowed',
    fine_amount: 0,
    notes: 'Dipinjam untuk musyawarah bahtsul masail',
    created_at: getPastDate(7, 10, 0)
  },
  {
    id: 'loan-002',
    loan_code: 'PJM-20260810-002',
    student_id: 'std-002',
    book_id: 'bk-002',
    borrow_date: getPastDate(11, 14, 0),
    due_date: getPastDate(4, 17, 0), // Overdue by 4 days
    return_date: null,
    status: 'overdue',
    fine_amount: 2000,
    notes: 'Terlambat 4 hari - Pengingat WA telah dikirimkan',
    created_at: getPastDate(11, 14, 0)
  },
  {
    id: 'loan-003',
    loan_code: 'PJM-20260818-003',
    student_id: 'std-003',
    book_id: 'bk-005',
    borrow_date: getPastDate(3, 9, 30),
    due_date: getPastDate(-4, 17, 0), // 4 days remaining
    return_date: null,
    status: 'borrowed',
    fine_amount: 0,
    notes: 'Tugas resume sejarah Islam',
    created_at: getPastDate(3, 9, 30)
  },
  {
    id: 'loan-004',
    loan_code: 'PJM-20260819-004',
    student_id: 'std-004',
    book_id: 'bk-004',
    borrow_date: getPastDate(2, 11, 0),
    due_date: getPastDate(-5, 17, 0),
    return_date: null,
    status: 'borrowed',
    fine_amount: 0,
    notes: 'Hafalan jurumiyah kelas 9',
    created_at: getPastDate(2, 11, 0)
  },
  {
    id: 'loan-005',
    loan_code: 'PJM-20260805-005',
    student_id: 'std-005',
    book_id: 'bk-006',
    borrow_date: getPastDate(16, 13, 0),
    due_date: getPastDate(9, 17, 0),
    return_date: getPastDate(9, 15, 30),
    status: 'returned',
    fine_amount: 0,
    notes: 'Dikembalikan tepat waktu dalam kondisi sangat baik',
    created_at: getPastDate(16, 13, 0)
  },
  {
    id: 'loan-006',
    loan_code: 'PJM-20260801-006',
    student_id: 'std-007',
    book_id: 'bk-007',
    borrow_date: getPastDate(20, 8, 30),
    due_date: getPastDate(13, 17, 0),
    return_date: getPastDate(12, 11, 0),
    status: 'returned',
    fine_amount: 0,
    notes: 'Dikembalikan tepat waktu',
    created_at: getPastDate(20, 8, 30)
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Sistem RFID Siap',
    message: 'Reader RFID terhubung dan beroperasi normal.',
    type: 'success',
    timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'notif-2',
    title: 'Peringatan Kapasitas',
    message: 'Kunjungan perpustakaan mencapai 60% dari batas maksimal.',
    type: 'info',
    timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    read: true
  }
];

export const supabaseSqlSchema = `-- SCHEMA DATABASE SUPABASE: Library Tap System
-- Dijalankan pada Supabase SQL Editor

-- 1. Table Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table Students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    photo_url TEXT,
    phone VARCHAR(30),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended', 'leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table RFID Cards
CREATE TABLE IF NOT EXISTS rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lost')),
    note TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table Library Visits
CREATE TABLE IF NOT EXISTS library_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rfid_card_id UUID REFERENCES rfid_cards(id) ON DELETE SET NULL,
    rfid_uid VARCHAR(100) NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'inside' CHECK (status IN ('inside', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table Books (Katalog Buku & Kitab)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    year INTEGER,
    category VARCHAR(100) NOT NULL,
    rack_location VARCHAR(100) NOT NULL,
    total_stock INTEGER NOT NULL DEFAULT 1,
    available_stock INTEGER NOT NULL DEFAULT 1,
    cover_url TEXT,
    isbn VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table Book Loans (Sirkulasi Peminjaman & Pengembalian)
CREATE TABLE IF NOT EXISTS book_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_code VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrow_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    fine_amount NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Indexes for fast RFID lookup and reporting
CREATE INDEX IF NOT EXISTS idx_rfid_cards_uid ON rfid_cards(uid);
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_visits_status ON library_visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_student_active ON library_visits(student_id, status);
CREATE INDEX IF NOT EXISTS idx_visits_check_in ON library_visits(check_in);
CREATE INDEX IF NOT EXISTS idx_books_code ON books(code);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_book_loans_status ON book_loans(status);
CREATE INDEX IF NOT EXISTS idx_book_loans_student ON book_loans(student_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_book ON book_loans(book_id);

-- 8. Trigger to automatically compute duration on check_out
CREATE OR REPLACE FUNCTION compute_visit_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out IS NOT NULL AND OLD.check_out IS NULL THEN
        NEW.duration_minutes = CEIL(EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 60.0);
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_compute_visit_duration
BEFORE UPDATE ON library_visits
FOR EACH ROW
EXECUTE FUNCTION compute_visit_duration();

-- 9. Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read for all" ON students FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read for cards" ON rfid_cards FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read for visits" ON library_visits FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read for books" ON books FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read for book_loans" ON book_loans FOR SELECT USING (true);
`;
