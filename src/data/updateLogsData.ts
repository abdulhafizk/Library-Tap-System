export type UpdateCategory = 'feature' | 'improvement' | 'fix' | 'security';

export interface UpdateItem {
  type: UpdateCategory;
  text: string;
}

export interface AppReleaseLog {
  version: string;
  releaseDate: string;
  tagline: string;
  isLatest?: boolean;
  highlights: string[];
  changes: {
    category: UpdateCategory;
    items: string[];
  }[];
}

export const appUpdateLogs: AppReleaseLog[] = [
  {
    version: 'v2.8.7',
    releaseDate: '19 September 2026',
    tagline: 'Otoritas Tunggal Reading Streak Berbasis Presensi RFID & Verifikasi Admin, Penghapusan Tombol Manual Santri',
    isLatest: true,
    highlights: [
      'Otoritas Sumber Data Tunggal (Single Source of Truth): Reading streak santri sepenuhnya divalidasi oleh sistem admin dan presensi perpustakaan berbasis RFID untuk mencegah manipulasi/kecurangan',
      'Penghapusan Input Manual Santri: Tombol "Mulai Membaca Sekarang" di seluruh dashboard santri telah ditiadakan dan digantikan dengan indikator verifikasi resmi serta pengingat kunjungan',
      'Fitur Verifikasi & Pencatatan Sesi oleh Petugas: Admin/ustadz kini memiliki modal khusus "+ Catat / Verifikasi Sesi" untuk memvalidasi muthola\'ah halaqah, bimbingan, atau presensi santri dengan stempel waktu resmi',
      'Tab Manajemen Log Sesi Membaca Seluruh Santri: Navigasi tab baru di panel admin untuk memantau seluruh riwayat sesi membaca, melacak sumber verifikasi (RFID vs Petugas), dan opsi koreksi/hapus sesi',
      'Sinkronisasi Real-Time Portal Santri: Santri dapat memantau capaian streak, durasi kumulatif, dan lencana milestone secara transparan dan terpercaya tanpa celah kecurangan'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Modal Entri & Verifikasi Sesi Membaca Admin: Memungkinkan petugas mencatat sesi muthola\'ah resmi santri dengan preset durasi, judul kitab/buku, dan catatan verifikator.',
          'Tab Log Sesi Membaca Seluruh Santri di Dashboard Admin: Tabel audit komprehensif seluruh aktivitas membaca dengan filter pencarian instan dan pembeda badge "Presensi RFID" vs "Verifikasi Petugas".',
          'Aksi Koreksi & Hapus Sesi: Tombol hapus sesi membaca di tabel log admin yang secara otomatis meregenerasi streak santri yang bersangkutan.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Integritas Data Streak Santri: Penegakan aturan anti-kecurangan dengan menjadikan tap RFID kunjungan perpustakaan dan validasi petugas sebagai syarat mutlak perolehan streak harian.',
          'UI/UX Status Terverifikasi di Dashboard Santri: Mengganti tombol sesi mandiri dengan kartu informasi panduan muthola\'ah dan badge verifikasi berikon perisai perlindungan.',
          'Penyempurnaan Rebuild Streak: Perhitungan ulang konsisten yang mendeteksi seluruh sesi valid baik dari kunjungan RFID maupun verifikasi pengampu.'
        ]
      },
      {
        category: 'security',
        items: [
          'Pencegahan Rekayasa Mandiri (Self-Report Prevention): Menutup celah pemicu streak sepihak dari sisi santri tanpa adanya kehadiran fisik atau validasi ustadz pengampu perpustakaan.'
        ]
      }
    ]
  },
  {
    version: 'v2.8.6',
    releaseDate: '18 September 2026',
    tagline: 'Audit Alur Trigger Notifikasi Santri, Pelacakan Status Seen Otomatis & Presisi Multi-Identifier',
    isLatest: false,
    highlights: [
      'Pelacakan Status Notifikasi Otomatis (Seen Tracking): Segera setelah santri masuk dashboard dan notifikasi dirender di layar, sistem langsung mengirim update status "seen" dengan stempel waktu presisi',
      'Pemisahan Logika Status "Seen" vs "Read": Status "seen" otomatis meredam animasi ping/bounce lonceng agar tidak mengganggu santri berulang kali, sementara status "read" tetap dikendalikan manual oleh santri',
      'Sinkronisasi Multi-Kunci Identitas Santri (ID & NIS): Status notifikasi tersinkronisasi kuat baik saat santri login menggunakan barcode ID UUID maupun NIS asrama',
      'Badge Visual "Dilihat" & Riwayat Waktu Render: Notifikasi di Pusat Notifikasi menampilkan badge status "Dilihat" lengkap dengan jam tampil, membedakan pesan baru dengan yang sudah diperiksa',
      'Stabilisasi ID Notifikasi Dinamis & Notifikasi Custom: ID notifikasi jatuh tempo dan peringatan muthola\'ah distabilkan agar status baca dan lihat tidak tereset akibat perubahan selisih hari'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Mekanisme Otomatis Notifikasi Seen di Dashboard Santri: Hook useEffect cerdas mendeteksi render pertama notifikasi dan memicu penyimpanan status seen_at secara non-blocking.',
          'Dukungan Properti seen & seen_at pada SantriNotification: Memperluas skema data notifikasi santri dengan dukungan stempel waktu kapan notifikasi tampil di layar.',
          'Badge Status "Dilihat" di Pusat Notifikasi Santri: Menambahkan elemen visual badge berwarna biru langit (sky) dengan ikon mata dan tooltip waktu render.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Optimalisasi Indikator Lonceng Notifikasi Header: Lonceng kini memprioritaskan unseen ping (pesan yang benar-benar belum terlihat) dibanding unread biasa agar lebih tenang dan informatif.',
          'Sinkronisasi Multi-Identifier Santri (UUID + NIS): Menjamin data status dibaca & dilihat tersimpan konsisten di localStorage di bawah kunci ID santri dan NIS sekaligus.',
          'Auto-Seen saat Tandai Dibaca: Tindakan menandai notifikasi sebagai dibaca otomatis mencatat status seen.'
        ]
      },
      {
        category: 'fix',
        items: [
          'Pencegahan Flapping / Resetter Status Pinjaman: Normalisasi ID notifikasi pinjaman (notif-loan-due-soon, notif-loan-due-today, notif-loan-overdue) sehingga pergantian hari tidak menghilangkan status telah dibaca.',
          'Penyempurnaan Payload Custom Notification: Memastikan fungsi addCustomSantriNotification mewarisi status seen default secara aman dan lolos verifikasi TypeScript.'
        ]
      }
    ]
  },
  {
    version: 'v2.8.5',
    releaseDate: '16 September 2026',
    tagline: 'PWA Online-First Cloud Supabase & Solusi Pemasangan Browser Standalone',
    isLatest: false,
    highlights: [
      'PWA Online-First Terintegrasi Database Cloud: Aplikasi yang diunduh di HP/PC dipastikan selalu online dan terhubung langsung ke database Supabase PostgreSQL real-time dengan strategi NetworkFirst',
      'Solusi Pesan "This app cannot be installed": Mengatasi pemblokiran instalasi bawaan browser Chrome/Edge saat dibuka di jendela pratinjau editor (iFrame) dengan tombol mandiri Buka di Tab Baru',
      'Registrasi Service Worker & Manifest HTML Valid: Pendaftaran Service Worker secara langsung (immediate: true) serta pemasangan link Web App Manifest di index.html agar menu instal browser selalu aktif',
      'Panduan Pemasangan & QR Code Diperbarui: Dialog petunjuk instalasi kini memperjelas perbedaan tab browser mandiri vs frame pratinjau, lengkap dengan QR Code cepat untuk HP',
      'Indikator Jaringan & Cloud Live Sync: Penegasan visual bahwa data sirkulasi, presensi santri, katalog kitab, dan denda langsung sinkron ke server online tanpa ketergantungan mode offline'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Workbox NetworkFirst Strategy untuk Database Supabase: Menjamin setiap panggilan API database (*.supabase.co dan proxy) selalu mengambil data segar terkini dari cloud PostgreSQL.',
          'Deteksi Cerdas Lingkungan iFrame (isInIframe): Sistem mendeteksi otomatis jika aplikasi sedang berjalan di dalam frame pratinjau dan menyediakan tombol aksi "Buka di Tab Baru" untuk bypass pembatasan browser.',
          'Link Manifest Web Terdaftar di Head: Menghubungkan file manifest.webmanifest secara eksplisit di index.html untuk memenuhi syarat mutlak Web App Installability Criteria Google Chrome.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Redesain Modal PWAInstallModal: Penambahan banner status database online real-time, pesan solusi instalasi iFrame, dan pembaruan badge fitur di bawah QR Code.',
          'Penyempurnaan Tab PWA pada Pengaturan Sistem: Menampilkan informasi status koneksi cloud Supabase aktif dan tombol pintas Buka Tab Baru bagi pengguna editor.',
          'Pembaruan Teks OfflineIndicator: Memastikan pengguna memahami bahwa sistem selalu memprioritaskan cloud database online dan hanya menggunakan antrean lokal sebagai pengaman darurat.'
        ]
      },
      {
        category: 'fix',
        items: [
          'Perbaikan Kendala "This app cannot be installed": Mengatasi kegagalan instalasi pada menu titik tiga (⋮) browser akibat pembatasan sandbox iframe.',
          'Optimasi Registrasi Service Worker di main.tsx: Penambahan opsi immediate: true untuk memastikan Service Worker langsung aktif tanpa perlu reload berulang.'
        ]
      }
    ]
  },
  {
    version: 'v2.8.4',
    releaseDate: '15 September 2026',
    tagline: 'Dukungan Progressive Web App (PWA) & Fitur Download Aplikasi Lintas Perangkat',
    isLatest: false,
    highlights: [
      'Download & Pasang Aplikasi Langsung (PWA): Aplikasi kini dapat diunduh dan dipasang di smartphone Android, iPhone/iPad, dan laptop/PC tanpa melalui app store',
      'Tombol Download di Semua Titik Kunci: Tersedia di bilah atas (Header), bilah samping (Sidebar), menu navigasi seluler bawah, halaman login, dan portal santri',
      'Dialog Panduan Lengkap & QR Code: Panduan langkah demi langkah untuk Google Chrome (Android), Apple Safari (iOS "Add to Home Screen"), serta Windows/Mac lengkap dengan QR Code instan',
      'Dukungan Penuh Mode Offline: Service Worker dengan cache aset otomatis dan penyimpanan lokal antrean RFID offline saat koneksi internet terputus',
      'Indikator Jaringan & Tab Pengaturan PWA: Pemberitahuan status koneksi real-time dan tab manajemen PWA baru di halaman Pengaturan Sistem'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Dukungan PWA Standalone Penuh: Konfigurasi Web App Manifest lengkap dengan ikon 192x192, 512x512 maskable, tema warna emerald, dan mode standalone layar penuh.',
          'PWA Install Prompt Cerdas (usePWAInstall): Deteksi otomatis kesiapan pemasangan browser dengan penanganan fallback panduan visual jika prompt otomatis diblokir sistem.',
          'Komponen PWAInstallButton Serbaguna: Mendukung varian compact, sidebar widget, full button, dan mobile banner interaktif.',
          'Modal Petunjuk Instalasi & Kode QR: Menyediakan instruksi spesifik OS (Android, iOS Safari, Desktop) serta QR Code untuk memasang di HP lain.',
          'Indikator Offline Global (OfflineIndicator): Banner status visual otomatis yang muncul saat koneksi terputus dan mengonfirmasi saat online kembali.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Integrasi Tab Pengaturan PWA: Tab baru "Aplikasi & PWA (Download)" pada Pengaturan Sistem dengan ringkasan mode tampilan, status instalasi, dan petunjuk perangkat.',
          'Aksesibilitas Download Santri & Tamu: Tombol download tersedia di Header Portal Santri dan Halaman Login agar santri dan wali santri dapat langsung memasang aplikasi di HP mereka.',
          'Optimasi Precache Aset Workbox: Konfigurasi limit precache aset ditingkatkan untuk menjamin kelancaran muat aplikasi saat mode offline.'
        ]
      }
    ]
  },
  {
    version: 'v2.8.3',
    releaseDate: '14 September 2026',
    tagline: 'Optimasi Antarmuka Sirkulasi & Meja Cepat Responsif Layar Ponsel (HP)',
    isLatest: false,
    highlights: [
      'Desain Kartu Sirkulasi Mobile Ergonomis: Tampilan kartu pinjaman smartphone dengan indikator sisa waktu / hari keterlambatan dan status interaktif',
      'Tombol Aksi Sentuh Cepat (Touch-Target 40px): Aksi pengembalian langsung, perpanjangan +7 hari, kirim bukti WA, dan cetak struk tanpa perlu zoom layar',
      'Scan Sirkulasi Instan dengan Kamera HP: Tombol kamera terintegrasi pada meja sirkulasi cepat untuk memindai kartu santri dan barcode kitab secara langsung',
      'Kembalikan Kitab 1-Tap Cerdas: Sistem otomatis mendeteksi buku yang sedang dipinjam santri dan menyediakan tombol kilat pengembalian satu sentuhan',
      'Optimalisasi Semua Modal Sirkulasi: Dialog formulir peminjaman, pengembalian, slip struk, dan katalog buku dibuat adaptif dengan batas layar aman'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Scanner Kamera HP Terintegrasi Meja Sirkulasi: Penambahan tombol pemindai kamera langsung di formulir deteksi santri dan pencarian kitab pada meja sirkulasi cepat.',
          'Deteksi Otomatis & Tombol Pengembalian 1-Tap: Meja sirkulasi cepat secara otomatis mengenali jika buku yang di-scan sedang dipinjam santri terdeteksi, menampilkan tombol kilat pengembalian instan.',
          'Penghitungan Durasi & Keterlambatan Real-time: Kartu pinjaman seluler menampilkan keterangan hari sisa tempo atau jumlah hari telat secara otomatis.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Redesain Kartu Pinjaman Smartphone: Penataan ulang kartu peminjaman pada layar seluler dengan rasio kontras tinggi, penempatan tombol proporsional, dan feedback visual sentuh.',
          'Filter Status Peminjaman dengan Penghitung Otomatis: Tab badge filter (Semua, Dipinjam, Jatuh Tempo, Dikembalikan) dilengkapi counter jumlah item dan gulir horizontal responsif.',
          'Standarisasi Modal Sirkulasi: Penyempurnaan LoanModal, ReturnModal, ReceiptModal, dan BookFormModal dengan padding mobile adaptif (p-2.5 sm:p-4) dan scrollview vertikal tanpa terpotong navbar.'
        ]
      }
    ]
  },
  {
    version: 'v2.8.2',
    releaseDate: '13 September 2026',
    tagline: 'Skeleton Loaders & Loading Overlays Sinkronisasi Menu & Profil Santri',
    isLatest: false,
    highlights: [
      'Pencegahan UI Flickering & Partial Rendering: Implementasi skeleton loaders berseri saat transisi sinkronisasi data menu dan profil santri',
      'Overlay Sinkronisasi Halus: Shimmer loading overlay dengan indikator status realtime saat proses pembaruan hak akses menu',
      'Pratinjau Profil & Portal Santri Terintegrasi: Tab pratinjau langsung di SantriMenuPage untuk meninjau efek pengaturan menu pada akun santri seketika',
      'Feedback Status Baris Menu: Penanda visual "Menyinkronkan..." dan spinner interaktif pada baris menu yang sedang diubah',
      'Tombol Uji Sinkronisasi: Fitur "Sinkronkan Sekarang" untuk memverifikasi konsistensi status lokal dan cloud secara transparan'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Skeleton Loaders Khusus Menu & Profil: Menambahkan komponen MenuRowSkeleton, MetricsSkeleton, dan ProfileViewSkeleton untuk menjaga konsistensi visual saat rendering awal atau pembaruan konfigurasi.',
          'Loading Overlays Interaktif: Menyematkan SyncLoadingOverlay dengan efek glassmorphism dan progress bar shimmer pada daftar menu dan pratinjau profil santri.',
          'Tab Pratinjau Profil & Portal Santri: Memungkinkan pengelola perpustakaan melihat simulasi nyata tampilan santri lengkap dengan 7 menu utama dan status modul aktif/terkunci.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Eliminasi Layout Shift & Flickering: Mencegah elemen UI melompat atau merender sebagian (partial rendering) selama proses toggle atau batch update berlangsung.',
          'Uji Coba Sinkronisasi Cepat: Tombol sinkronisasi manual di header untuk memicu sinkronisasi realtime dan melihat feedback visual secara instan.',
          'Peningkatan Responsivitas Navigasi: Transisi mulus antara tab pengaturan akses menu dan tab pratinjau profil santri.'
        ]
      }
    ]
  },
  {
    version: 'v2.8.1',
    releaseDate: '13 September 2026',
    tagline: 'Perbaikan Sinkronisasi Real-Time Menu Santri & Stabilitas React Hooks',
    isLatest: false,
    highlights: [
      'Perbaikan Bug Sinkronisasi: Perubahan status aktif/nonaktif pada Menu Santri langsung tersinkronisasi seketika di Portal Santri',
      'Resolusi React Hooks Error: Memperbaiki urutan eksekusi hooks tak bersyarat pada ReturnModal sirkulasi',
      'Header Santri 7 Menu Terintegrasi: Indikator visual status aktif / nonaktif (Off) yang jelas dan responsif',
      'Sinkronisasi Multi-Tab & Supabase: Dukungan event listener storage dan sinkronisasi awan untuk konfigurasi menu santri',
      'Penyediaan tampilan lengkap untuk modul Riwayat Selesai, Pengembalian Mandiri, dan Buku Favorit'
    ],
    changes: [
      {
        category: 'fix',
        items: [
          'Resolusi Fatal React Hooks Error: Memperbaiki urutan hooks pada komponen ReturnModal dengan memindahkan custom hooks ke level teratas komponen tanpa evaluasi kondisional.',
          'Sinkronisasi Menu Santri 100% Real-Time: Memperbaiki celah pembaruan antara SantriMenuSettingsTab / SantriMenuPage dan SantriDashboard, sehingga toggle status langsung tampak di kartu aksi Beranda maupun bilah navigasi santri.',
          'Cross-Tab & Cloud Persistence Sync: Menambahkan listener storage event dan integrasi tabel santri_menus pada mekanisme push/pull Supabase dan BroadcastChannel lokal.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Top Header 7 Menu Santri Tetap Stabil: Menjaga struktur 7 menu utama santri tanpa layout shift saat menu dinonaktifkan, disertai penanda status (Off) dan proteksi UnderDevelopmentOverlay.',
          'Penambahan Tampilan Modul Tambahan: Mengimplementasikan tampilan interaktif untuk Riwayat Peminjaman Selesai (history), Panduan Pengembalian Mandiri (returns), dan Koleksi Favorit (bookmark).',
          'Pembaruan Log Rilis Aplikasi: Memperbarui catatan pembaruan sistem dan riwayat versi perpustakaan.'
        ]
      }
    ]
  },
  {
    version: 'v2.8.0',
    releaseDate: '10 September 2026',
    tagline: 'Menu Mandiri Portal Santri & Sistem Pintasan Keyboard Global (Spotlight)',
    isLatest: false,
    highlights: [
      'Top Header Portal Santri Tepat 7 Menu: Beranda, Kartu Digital, Riwayat Kunjungan, Pinjaman, Catatan Baca, Lencana, & Profil',
      'Pemisahan Menu Santri menjadi modul navigasi mandiri di Sidebar & Mobile Nav',
      'Spotlight Command Palette (Ctrl+K / Cmd+K) untuk pencarian santri, buku, dan aksi cepat',
      'Pintasan alur kerja perpustakaan (Ctrl+B Sirkulasi, Alt+T Presensi Tap, Alt+1 s.d. Alt+9 Navigasi)',
      'Modal Panduan Pintasan Keyboard interaktif (Ctrl+/ atau ?) dengan pencarian instan',
      'Penyederhanaan dan perapian antarmuka Portal Santri serta eliminasi navigasi redundan'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Top Header Portal Santri Tepat 7 Menu: Membatasi bilah navigasi atas dashboard santri menjadi tepat 7 menu esensial (Beranda/Dashboard, Kartu Anggota Digital, Riwayat Kunjungan, Peminjaman Saya, Catatan Baca & Faedah, Lencana & Penghargaan, Profil Santri) agar tampilan bersih, proporsional, dan nyaman digunakan.',
          'Navigasi Kembali Terpadu: Menyediakan tombol kembali ke Beranda pada tampilan katalog dan usulan buku yang diakses melalui kartu aksi beranda santri.',
          'Menu Mandiri "Menu Santri": Memindahkan pengaturan hak akses menu santri dari halaman Pengaturan ke bilah navigasi utama dengan halaman dedikasi tersendiri (SantriMenuPage).',
          'Spotlight Command Palette (Ctrl+K): Pencarian global terpadu yang memfilter santri, koleksi buku & kitab, kartu RFID, dan perintah navigasi sistem secara instan.',
          'Pintasan Alur Kerja Sirkulasi (Ctrl+B): Membuka modul peminjaman, pengembalian, dan katalog inventaris buku dengan satu kombinasi tombol.',
          'Modal Cheat Sheet Pintasan Keyboard (Ctrl+/ atau ?): Panduan lengkap seluruh pintasan keyboard dengan filter pencarian dan kemampuan eksekusi aksi secara langsung dengan sekali klik.',
          'Pintasan Cepat Tambahan: Alt+T untuk Meja Presensi Tap, Alt+J untuk Menu Santri, Alt+M untuk Mode Gelap, Alt+V untuk Audio Buzzer, dan Alt+W untuk Panel WhatsApp.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Perapian Halaman Pengaturan (SettingsPage): Tab menu santri dilepas sehingga halaman pengaturan terfokus pada konfigurasi operasional inti perpustakaan, scanner RFID, WhatsApp, dan skema Supabase.',
          'Perapian Antarmuka Dashboard Santri: Penataan bilah atas dan pembersihan tombol navigasi kembali redundan untuk alur pengguna yang lebih bersih dan ringkas.',
          'Indikator Visual Pintasan Keyboard di Header dan Sidebar: Memudahkan staf perpustakaan mengetahui tombol pintas yang tersedia.'
        ]
      },
      {
        category: 'fix',
        items: [
          'Perbaikan penanganan event keyboard shortcut agar tidak mengganggu pengetikan saat pengguna sedang fokus di input field, textarea, maupun select box.',
          'Penyempurnaan routing dan state navigasi langsung dari command palette tanpa konflik modal.'
        ]
      }
    ]
  },
  {
    version: 'v2.7.0',
    releaseDate: '7 September 2026',
    tagline: 'Pengaturan Menu Santri Terpusat & Kontrol Fitur Dinamis',
    isLatest: false,
    highlights: [
      'Fitur Pengaturan Menu Santri di Dashboard Admin (Pengaturan → Menu Santri)',
      'Kontrol Toggle ON / OFF visibilitas dan status aktivasi modul akun Santri',
      'Tampilan indikator "Sedang Dalam Pengembangan" (Under Development) yang elegan untuk menu nonaktif',
      'Katalog Buku & Kitab interaktif baru untuk pencarian dan penelusuran koleksi mandiri',
      'Sinkronisasi real-time instan antar browser dan cloud database untuk perubahan menu'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Halaman Pengaturan Menu Santri: Admin dapat mengatur aktivasi status menu santri secara dinamis dengan toggle responsif, batch switch, dan tombol reset default.',
          'Navigasi Santri Dinamis: Menu santri di-render secara otomatis dari state database santri_menus, bukan lagi kode statis.',
          'Under Development Overlay: Halaman transisi yang informatif dan ramah ketika santri mengakses modul yang sedang dalam pengerjaan.',
          'Tab Katalog Buku Santri: Fitur penelusuran buku, filter kategori, cek ketersediaan stok fisik, dan lokasi rak langsung dari akun santri.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Penyempurnaan guard rute dashboard santri untuk mencegah akses langsung ke URL atau tab yang dinonaktifkan admin.',
          'Peningkatan real-time listener Supabase Sync untuk propagasi tabel santri_menus secara instan.'
        ]
      },
      {
        category: 'security',
        items: [
          'Enforce otorisasi admin untuk manipulasi konfigurasi menu santri dengan validasi state terpusat.'
        ]
      }
    ]
  },
  {
    version: 'v2.6.0',
    releaseDate: '7 September 2026',
    tagline: 'Sistem Notifikasi Real-Time Admin & Log Pembaruan Sistem Terintegrasi',
    isLatest: false,
    highlights: [
      'Peringatan otomatis peminjaman overdue dan kalkulasi denda harian',
      'Alert instan usulan buku/kitab baru dari santri yang menunggu persetujuan',
      'Pemantau kapasitas ruang baca perpustakaan secara real-time',
      'Deteksi kartu RFID belum terdaftar dengan tombol pendaftaran cepat',
      'Halaman Update Log resmi untuk transparansi riwayat fitur dan changelog'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Menu Update Log baru di Sidebar & Mobile Nav: Riwayat changelog, filter kategori pembaruan, dan status versi sistem.',
          'Banner Alert Real-time Dashboard: Sistem peringatan proaktif dengan badge Kritis/Peringatan, tombol aksi langsung, dan audio alert.',
          'Integrasi Dropdown Notifikasi Header: Penyatuan alert sistem real-time dengan riwayat notifikasi perpustakaan.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Mekanisme fallback koneksi cloud Supabase tanpa mengganggu operasional lokal/offline.',
          'Dukungan filter cepat kategori notifikasi alert (Semua, Kritis, Peringatan) dan kontrol mute audio.',
          'Desain banner peringatan responsif yang rapi pada layar smartphone, tablet, hingga TV Kiosk.'
        ]
      },
      {
        category: 'fix',
        items: [
          'Penanganan warning skema Supabase untuk tabel wishlist dan literacy awards secara graceful.',
          'Pembersihan cache dismiss alert saat sesi diperbarui agar peringatan kritis tetap terpantau.'
        ]
      }
    ]
  },
  {
    version: 'v2.5.0',
    releaseDate: '4 September 2026',
    tagline: 'Portal Santri Digital, Sirkulasi Usulan Buku, & Piagam Penghargaan Literasi',
    highlights: [
      'Dashboard khusus santri login mandiri dengan NIS & Kata Sandi',
      'Katalog piagam literasi resmi ber-QR Code dengan nomor sertifikat unik',
      'Sistem usulan kitab/buku (Wishlist) santri langsung ke staf perpustakaan',
      'Level santri, perolehan XP, dan lencana membaca interaktif'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Portal Santri Mandiri: Melihat riwayat kunjungan, buku pinjaman, dan status kartu fisik secara mandiri.',
          'Form Pengajuan Usulan Buku: Santri dapat mengajukan judul kitab/buku turats yang dibutuhkan untuk kegiatan ta\'lim.',
          'Manajemen Piagam & Sertifikat Literasi: Pencetakan piagam resmi pesantren dalam format PDF ber-QR Code autentik.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Animasi kartu literasi dengan indikator level santri (Santri Pembaca, Santri Peneliti, dll.).',
          'Tampilan mobile portal santri dengan menu navigasi bawah yang ergonomis.'
        ]
      }
    ]
  },
  {
    version: 'v2.4.0',
    releaseDate: '28 Agustus 2026',
    tagline: 'Kios Display TV Ruang Baca & Modul Sirkulasi Peminjaman Kitab',
    highlights: [
      'Tampilan layar penuh Kios TV interaktif untuk ruang baca',
      'Sirkulasi peminjaman & pengembalian buku dengan kalkulator denda keterlambatan',
      'Notifikasi WhatsApp Gateway untuk wali santri saat tap kartu'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Display Kios TV: Menampilkan santri yang sedang berada di perpustakaan secara live dengan jam digital dan statistik harian.',
          'Modul Sirkulasi Buku: Pencatatan peminjaman, perpanjangan, dan pengembalian buku dengan barcode scanner atau input judul.',
          'Integrasi WhatsApp Notifikasi: Pengiriman pesan otomatis kehadiran santri ke nomor WhatsApp orang tua/wali.'
        ]
      },
      {
        category: 'improvement',
        items: [
          'Algoritma anti-passback untuk mencegah tap ganda yang tidak disengaja.',
          'Efek suara tap kartu audio web synthesis yang jernih dan responsif.'
        ]
      }
    ]
  },
  {
    version: 'v2.0.0',
    releaseDate: '15 Agustus 2026',
    tagline: 'Fondasi Sistem Presensi RFID Terintegrasi Pesantren',
    highlights: [
      'Presensi tap RFID 13.56MHz & NFC berkecepatan tinggi',
      'Manajemen kartu RFID santri dan penetapan UID',
      'Analitik dan laporan kunjungan per kelas dan gender'
    ],
    changes: [
      {
        category: 'feature',
        items: [
          'Sistem Presensi RFID Tap: Integrasi sensor kartu cerdas untuk mencatat jam masuk dan keluar santri secara otomatis.',
          'Database Santri & Kelas: Pengelolaan data santri lengkap dengan NIS, kelas, kamar pondok, dan status aktif.',
          'Analitik Kunjungan: Grafik statistik tren kunjungan harian, mingguan, dan bulanan.'
        ]
      },
      {
        category: 'security',
        items: [
          'Autentikasi multi-peran (Admin, Staf Pustakawan, dan Santri).',
          'Fitur auto-logout sesi tidak aktif demi keamanan data perpustakaan.'
        ]
      }
    ]
  }
];
