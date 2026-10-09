export type PortfolioExample = {
  id: string;
  demoUrl: null;
  is_concept: true;
  category: string;
  title: string;
  summary: string;
  technologies: string[];
  preview: 'analytics' | 'commerce' | 'clinic' | 'ordering' | 'village' | 'learning';
};

export const portfolioExamples: PortfolioExample[] = [
  {
    id: '82d4d146-97ad-481a-8eb9-9a376f423401',
    demoUrl: null,
    is_concept: true,
    category: 'Data & visualisasi',
    title: 'Sistem Data Analysis',
    summary: 'Konsep dashboard analitik untuk merangkum data penjualan, performa, dan tren bisnis dalam satu tampilan.',
    technologies: ['Dashboard', 'Visualisasi data', 'Web app'],
    preview: 'analytics',
  },
  {
    id: '82d4d146-97ad-481a-8eb9-9a376f423402',
    demoUrl: null,
    is_concept: true,
    category: 'Web development',
    title: 'E-Commerce Management',
    summary: 'Konsep platform pengelolaan katalog, keranjang, pesanan, pembayaran, dan stok untuk toko online.',
    technologies: ['E-commerce', 'Katalog', 'Manajemen stok'],
    preview: 'commerce',
  },
  {
    id: '82d4d146-97ad-481a-8eb9-9a376f423403',
    demoUrl: null,
    is_concept: true,
    category: 'Application',
    title: 'Sistem Antrian Klinik',
    summary: 'Konsep aplikasi untuk melihat nomor antrian, jadwal layanan, dan status kunjungan klinik.',
    technologies: ['Aplikasi web', 'Antrian', 'Dashboard'],
    preview: 'clinic',
  },
  {
    id: '82d4d146-97ad-481a-8eb9-9a376f423404',
    demoUrl: null,
    is_concept: true,
    category: 'Data & product',
    title: 'Self-Ordering System',
    summary: 'Konsep antarmuka pemesanan mandiri yang membantu pelanggan menelusuri menu dan mengirim pesanan.',
    technologies: ['Pemesanan', 'Menu digital', 'Tablet'],
    preview: 'ordering',
  },
  {
    id: '82d4d146-97ad-481a-8eb9-9a376f423405',
    demoUrl: null,
    is_concept: true,
    category: 'Information system',
    title: 'Sistem Informasi Kependudukan',
    summary: 'Konsep sistem administrasi untuk merapikan data warga, permohonan dokumen, dan informasi desa.',
    technologies: ['Administrasi', 'Data warga', 'Portal web'],
    preview: 'village',
  },
  {
    id: '82d4d146-97ad-481a-8eb9-9a376f423406',
    demoUrl: null,
    is_concept: true,
    category: 'Game application',
    title: 'Math EduGame Subscription',
    summary: 'Konsep aplikasi belajar matematika interaktif dengan materi bertahap dan latihan untuk siswa.',
    technologies: ['EdTech', 'Gamifikasi', 'Aplikasi belajar'],
    preview: 'learning',
  },
];
