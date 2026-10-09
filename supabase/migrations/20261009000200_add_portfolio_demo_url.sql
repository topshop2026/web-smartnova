ALTER TABLE portfolio_projects
  ADD COLUMN IF NOT EXISTS demo_url text,
  ADD COLUMN IF NOT EXISTS is_concept boolean NOT NULL DEFAULT false;

INSERT INTO portfolio_projects (
  id, title, summary, role, technologies, outcomes, demo_url, published, is_concept
) VALUES
  (
    '82d4d146-97ad-481a-8eb9-9a376f423401',
    'Sistem Data Analysis',
    'Konsep dashboard analitik untuk merangkum data penjualan, performa, dan tren bisnis dalam satu tampilan.',
    'Data & visualisasi',
    ARRAY['Dashboard', 'Visualisasi data', 'Web app'],
    '{}', NULL, true, true
  ),
  (
    '82d4d146-97ad-481a-8eb9-9a376f423402',
    'E-Commerce Management',
    'Konsep platform pengelolaan katalog, keranjang, pesanan, pembayaran, dan stok untuk toko online.',
    'Web development',
    ARRAY['E-commerce', 'Katalog', 'Manajemen stok'],
    '{}', NULL, true, true
  ),
  (
    '82d4d146-97ad-481a-8eb9-9a376f423403',
    'Sistem Antrian Klinik',
    'Konsep aplikasi untuk melihat nomor antrian, jadwal layanan, dan status kunjungan klinik.',
    'Application',
    ARRAY['Aplikasi web', 'Antrian', 'Dashboard'],
    '{}', NULL, true, true
  ),
  (
    '82d4d146-97ad-481a-8eb9-9a376f423404',
    'Self-Ordering System',
    'Konsep antarmuka pemesanan mandiri yang membantu pelanggan menelusuri menu dan mengirim pesanan.',
    'Data & product',
    ARRAY['Pemesanan', 'Menu digital', 'Tablet'],
    '{}', NULL, true, true
  ),
  (
    '82d4d146-97ad-481a-8eb9-9a376f423405',
    'Sistem Informasi Kependudukan',
    'Konsep sistem administrasi untuk merapikan data warga, permohonan dokumen, dan informasi desa.',
    'Information system',
    ARRAY['Administrasi', 'Data warga', 'Portal web'],
    '{}', NULL, true, true
  ),
  (
    '82d4d146-97ad-481a-8eb9-9a376f423406',
    'Math EduGame Subscription',
    'Konsep aplikasi belajar matematika interaktif dengan materi bertahap dan latihan untuk siswa.',
    'Game application',
    ARRAY['EdTech', 'Gamifikasi', 'Aplikasi belajar'],
    '{}', NULL, true, true
  )
ON CONFLICT (id) DO NOTHING;
