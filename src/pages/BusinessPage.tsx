import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Code2, Headphones, MessageCircle, ShieldCheck } from 'lucide-react';
import { LeadForm } from '@/components/LeadForm';
import { businessEmail, getWhatsAppUrl, servicePackages, trackEvent } from '@/lib/business';
import { supabase, type PortfolioProject } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { portfolioExamples } from '@/lib/portfolioExamples';
import { PortfolioCard } from '@/components/PortfolioCard';

type BusinessPageProps = {
  page: string;
  service?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
};

const workSteps = [
  ['01', 'Discovery', 'Kami memahami tujuan, pengguna, alur kerja, dan batasan proyek.'],
  ['02', 'Ruang lingkup', 'Prioritas, deliverable, asumsi, biaya, dan jadwal dibahas sebelum mulai.'],
  ['03', 'Desain & pengembangan', 'Solusi dibangun bertahap dengan komunikasi dan evaluasi yang disepakati.'],
  ['04', 'Uji & serah terima', 'Hasil diperiksa bersama; dokumentasi dan dukungan mengikuti kesepakatan.'],
];

const privacySections = [
  {
    title: '1. Pendahuluan',
    paragraphs: [
      'SmartNova sangat menghargai privasi dan keamanan data Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, melindungi, dan memproses informasi pribadi Anda saat mengunjungi situs web atau menggunakan layanan dan produk digital kami di https://smartnova.site. Dengan mengakses atau menggunakan layanan kami, Anda dianggap telah membaca dan menyetujui ketentuan dalam kebijakan ini.',
    ],
  },
  {
    title: '2. Informasi yang Kami Kumpulkan',
    paragraphs: [
      'Untuk menyediakan layanan, produk, dan pengalaman terbaik bagi Anda, kami dapat mengumpulkan jenis informasi berikut:',
    ],
    items: [
      'Informasi Kontak: Nama, alamat email, atau nomor WhatsApp yang Anda berikan secara sukarela saat mengisi formulir konsultasi, melakukan pemesanan, atau menghubungi layanan pelanggan kami.',
      'Data Transaksi: Rincian mengenai produk digital atau paket layanan yang Anda beli, riwayat pesanan, serta metode pembayaran yang digunakan.',
      'Data Teknis: Informasi otomatis seperti alamat IP, jenis peramban (browser), perangkat yang digunakan, serta data analitik kunjungan untuk meningkatkan performa situs web kami.',
    ],
  },
  {
    title: '3. Penggunaan Informasi',
    paragraphs: ['Informasi yang kami kumpulkan digunakan secara profesional untuk keperluan berikut:'],
    items: [
      'Memproses pesanan produk digital, layanan, atau permintaan konsultasi proyek Anda.',
      'Mengirimkan konfirmasi transaksi, pembaruan layanan, atau informasi penting terkait akun Anda.',
      'Meningkatkan kualitas produk, fitur situs web, dan pengalaman pengguna secara berkala.',
      'Memberikan dukungan teknis atau merespons pertanyaan dan kendala yang Anda sampaikan.',
    ],
  },
  {
    title: '4. Keamanan dan Perlindungan Data',
    paragraphs: [
      'Kami berkomitmen untuk menjaga keamanan data pribadi Anda. Kami menerapkan langkah-langkah pengamanan teknis, administratif, dan fisik yang wajar untuk melindungi informasi Anda dari akses, penggunaan, modifikasi, atau pengungkapan yang tidak sah.',
    ],
  },
  {
    title: '5. Pihak Ketiga dan Layanan Eksternal',
    paragraphs: [
      'Kami tidak akan menjual, memperdagangkan, atau menyewakan informasi pribadi Anda kepada pihak ketiga. Dalam hal tertentu, kami dapat menggunakan layanan pihak ketiga yang tepercaya (seperti gateway pembayaran atau platform analitik) yang terikat dengan kewajiban kerahasiaan yang ketat guna mendukung operasional situs web kami.',
    ],
  },
  {
    title: '6. Perubahan Kebijakan Privasi',
    paragraphs: [
      'SmartNova berhak untuk memperbarui atau mengubah Kebijakan Privasi ini sewaktu-waktu. Setiap perubahan akan dipublikasikan pada halaman ini dengan tanggal pembaruan yang disesuaikan. Kami menyarankan Anda untuk memeriksa halaman ini secara berkala.',
    ],
  },
  {
    title: '7. Hubungi Kami',
    paragraphs: [
      'Jika Anda memiliki pertanyaan, saran, atau permintaan terkait Kebijakan Privasi ini, silakan hubungi tim kami melalui halaman Kontak SmartNova atau melalui sarana komunikasi resmi yang tersedia di situs web kami.',
    ],
  },
];

type TermsListGroup = { title?: string; items: string[]; ordered?: boolean };
type TermsSection = {
  title: string;
  paragraphs: string[];
  groups?: TermsListGroup[];
  closing?: string[];
  additionalGroups?: TermsListGroup[];
  finalParagraphs?: string[];
};

const termsSections: TermsSection[] = [
  {
    title: '1. RUANG LINGKUP LAYANAN SMARTNOVA',
    paragraphs: ['SmartNova menyediakan berbagai produk dan layanan digital, termasuk tetapi tidak terbatas pada:'],
    groups: [
      {
        title: 'A. Produk Digital dan Aplikasi',
        items: [
          'Aplikasi kasir (Point of Sale/POS).',
          'Aplikasi kasir restoran.',
          'Aplikasi kasir laundry.',
          'Aplikasi kasir bengkel dan pengelolaan sparepart.',
          'Aplikasi pengelolaan keuangan keluarga dan kas lingkungan.',
          'Aplikasi manajemen usaha dan inventaris.',
          'Berbagai aplikasi produktivitas dan solusi perangkat lunak lainnya.',
        ],
      },
      {
        title: 'B. Jasa Pengembangan Website',
        items: [
          'Website profil perusahaan (Company Profile).',
          'Website portofolio profesional.',
          'Website sekolah dan institusi pendidikan.',
          'Website toko online (E-Commerce).',
          'Website bisnis, organisasi, dan UMKM.',
          'Website sistem informasi dan aplikasi berbasis web.',
        ],
      },
      {
        title: 'C. Jasa Pengembangan Software dan Aplikasi',
        items: [
          'Pengembangan aplikasi Android dan mobile.',
          'Pengembangan aplikasi berbasis web.',
          'Sistem manajemen bisnis dan administrasi.',
          'Sistem database dan pengolahan data.',
          'Integrasi API dan layanan pihak ketiga.',
          'Pengembangan software sesuai kebutuhan pelanggan.',
        ],
      },
      {
        title: 'D. Layanan Teknologi Tambahan',
        items: [
          'Konsultasi dan perencanaan sistem digital.',
          'Pengembangan UI/UX dan desain antarmuka.',
          'Pengelolaan dan pengembangan dashboard admin.',
          'Optimasi dan peningkatan sistem.',
          'Instalasi, konfigurasi, dan dukungan teknis sesuai kesepakatan.',
        ],
      },
    ],
    closing: ['Ketersediaan setiap produk dan layanan dapat berubah sesuai pengembangan dan kebijakan SmartNova.'],
  },
  {
    title: '2. INFORMASI PAKET, HARGA, DAN PENAWARAN',
    paragraphs: [
      'Informasi paket, harga, spesifikasi, fitur, dan layanan yang ditampilkan pada website SmartNova merupakan informasi awal untuk membantu pelanggan memahami pilihan produk dan layanan yang tersedia.',
      'Informasi tersebut bukan merupakan penawaran kontraktual yang mengikat secara otomatis.',
      'Untuk proyek pengembangan website, aplikasi, maupun software custom, SmartNova dapat menyediakan proposal atau penawaran tertulis yang menjelaskan secara lebih terperinci:',
    ],
    groups: [{
      items: [
        'Ruang lingkup pekerjaan (Scope of Work).',
        'Spesifikasi dan fitur yang akan dikembangkan.',
        'Hasil akhir pekerjaan (Deliverables).',
        'Teknologi dan infrastruktur yang digunakan.',
        'Jadwal pengerjaan dan estimasi penyelesaian.',
        'Rincian biaya dan tahapan pembayaran.',
        'Ketentuan lisensi dan kepemilikan hasil pekerjaan.',
        'Jumlah dan batas revisi.',
        'Ketentuan instalasi dan serah terima.',
        'Masa garansi dan dukungan teknis.',
        'Biaya tambahan apabila terdapat permintaan di luar kesepakatan.',
      ],
    }],
    closing: ['Ketentuan final suatu proyek mengikuti proposal, invoice, perjanjian, atau kesepakatan tertulis yang telah disetujui oleh SmartNova dan pelanggan.'],
  },
  {
    title: '3. PEMBELIAN PRODUK DIGITAL',
    paragraphs: [
      'Setiap pembelian produk digital SmartNova mengikuti spesifikasi, fitur, harga, dan ketentuan lisensi yang berlaku pada produk tersebut.',
      'Pelanggan bertanggung jawab untuk:',
    ],
    groups: [{
      items: [
        'Memastikan produk sesuai dengan kebutuhan sebelum melakukan pembelian.',
        'Membaca informasi fitur dan persyaratan teknis produk.',
        'Memastikan perangkat memenuhi spesifikasi minimum yang diperlukan.',
        'Menggunakan produk sesuai fungsi dan ketentuan lisensi.',
        'Menjaga keamanan akun, kode aktivasi, atau informasi lisensi apabila tersedia.',
      ],
    }],
    closing: [
      'SmartNova berhak melakukan pembaruan, peningkatan, atau perubahan fitur produk untuk kepentingan pengembangan, keamanan, dan peningkatan kualitas layanan.',
      'Setiap perubahan yang berdampak material terhadap fitur atau hak penggunaan pelanggan akan diinformasikan sesuai kebijakan produk yang berlaku.',
    ],
  },
  {
    title: '4. KETENTUAN LISENSI APLIKASI',
    paragraphs: [
      'Produk aplikasi SmartNova dapat menggunakan sistem lisensi yang berbeda sesuai jenis produk dan paket pembelian.',
      'Ketentuan lisensi dapat berupa:',
    ],
    groups: [
      { items: ['Lisensi penggunaan satu kali bayar.', 'Lisensi penggunaan tahunan.', 'Lisensi berdasarkan perangkat.', 'Lisensi berdasarkan akun atau pengguna.', 'Lisensi khusus berdasarkan kesepakatan.'] },
    ],
    closing: [
      'Khusus aplikasi yang dipasarkan dengan konsep pembayaran satu kali untuk penggunaan jangka panjang, hak penggunaan mengikuti ketentuan lisensi yang tercantum pada saat pembelian.',
      'Lisensi penggunaan tidak secara otomatis memberikan hak kepemilikan atas kode sumber (source code), desain, merek, maupun teknologi yang digunakan dalam aplikasi.',
      'Pelanggan dilarang:',
    ],
    additionalGroups: [{
      items: [
        'Menggandakan atau mendistribusikan aplikasi tanpa izin.',
        'Menjual kembali aplikasi atau lisensinya tanpa persetujuan tertulis.',
        'Membongkar, memodifikasi, atau merekayasa balik sistem untuk tujuan yang melanggar hak kekayaan intelektual.',
        'Menghapus informasi hak cipta atau identitas kepemilikan SmartNova.',
        'Menggunakan aplikasi untuk aktivitas ilegal atau merugikan pihak lain.',
      ],
    }],
    finalParagraphs: ['Ketentuan khusus mengenai jumlah perangkat, masa aktif, pembaruan, dan batas penggunaan mengikuti lisensi masing-masing produk.'],
  },
  {
    title: '5. KETENTUAN APLIKASI OFFLINE',
    paragraphs: [
      'Beberapa produk SmartNova dirancang untuk dapat beroperasi secara offline dengan penyimpanan data lokal pada perangkat pengguna.',
      'Untuk produk dengan fitur offline, perlu diperhatikan bahwa:',
    ],
    groups: [{
      items: [
        'Pengoperasian fitur utama dapat dilakukan tanpa koneksi internet sesuai spesifikasi aplikasi.',
        'Fitur yang membutuhkan koneksi internet tetap memerlukan jaringan yang tersedia.',
        'Sinkronisasi, pencadangan cloud, integrasi eksternal, atau layanan online hanya tersedia apabila memang disediakan dan dikonfigurasi.',
        'Keamanan perangkat dan penyimpanan data lokal menjadi tanggung jawab pengguna.',
        'Pelanggan disarankan melakukan pencadangan data secara berkala.',
        'Kerusakan perangkat, penghapusan aplikasi, atau kehilangan data lokal dapat memengaruhi ketersediaan data apabila tidak tersedia cadangan.',
      ],
    }],
    closing: ['SmartNova tidak menjamin seluruh fitur aplikasi dapat berjalan tanpa internet apabila fitur tersebut bergantung pada layanan eksternal.'],
  },
  {
    title: '6. PEMESANAN JASA PENGEMBANGAN',
    paragraphs: [
      'Pemesanan jasa pengembangan website, aplikasi, dan software dilakukan melalui komunikasi serta kesepakatan antara SmartNova dan pelanggan.',
      'Sebelum pekerjaan dimulai, pelanggan akan memperoleh informasi mengenai:',
    ],
    groups: [{
      items: [
        'Kebutuhan dan tujuan proyek.',
        'Ruang lingkup pengembangan.',
        'Fitur dan spesifikasi sistem.',
        'Estimasi waktu pengerjaan.',
        'Biaya pengembangan.',
        'Jadwal pembayaran.',
        'Ketentuan revisi.',
        'Hak penggunaan dan kepemilikan hasil pekerjaan.',
        'Dukungan setelah proyek selesai.',
      ],
    }],
    closing: [
      'Pekerjaan akan dimulai setelah proposal atau penawaran disetujui dan persyaratan awal yang disepakati telah dipenuhi.',
      'Setiap permintaan tambahan di luar ruang lingkup awal dapat memerlukan penyesuaian biaya dan jadwal pengerjaan.',
    ],
  },
  {
    title: '7. PEMBAYARAN DAN BIAYA LAYANAN',
    paragraphs: [
      'Pembayaran produk dan jasa SmartNova mengikuti harga serta metode pembayaran yang diinformasikan pada saat transaksi atau dalam penawaran tertulis.',
      'Untuk proyek pengembangan, pembayaran dapat dilakukan melalui beberapa tahapan, misalnya:',
    ],
    groups: [{
      items: [
        'Pembayaran uang muka (Down Payment/DP).',
        'Pembayaran berdasarkan progres pekerjaan.',
        'Pelunasan setelah penyelesaian atau sebelum serah terima sesuai kesepakatan.',
      ],
    }],
    closing: [
      'Ketentuan pembayaran akan dicantumkan dalam invoice atau dokumen penawaran.',
      'Apabila pelanggan terlambat melakukan pembayaran, SmartNova berhak menunda sementara pengerjaan atau penyerahan hasil pekerjaan setelah memberikan pemberitahuan kepada pelanggan.',
      'Biaya tambahan yang mungkin timbul, seperti domain, hosting, server, lisensi software, layanan API, payment gateway, dan layanan pihak ketiga lainnya, akan diinformasikan secara terpisah apabila tidak termasuk dalam paket yang disepakati.',
    ],
  },
  {
    title: '8. REVISI DAN PERUBAHAN PROYEK',
    paragraphs: [
      'SmartNova memberikan kesempatan kepada pelanggan untuk melakukan revisi sesuai batas dan ketentuan yang tercantum dalam proposal atau kesepakatan proyek.',
      'Revisi dapat mencakup:',
    ],
    groups: [{
      items: [
        'Penyesuaian desain dan tampilan.',
        'Perbaikan teks dan konten.',
        'Penyesuaian elemen antarmuka.',
        'Perbaikan fungsi yang tidak sesuai spesifikasi awal.',
      ],
    }],
    closing: [
      'Permintaan yang termasuk perubahan besar, penambahan fitur baru, perubahan konsep, atau perubahan ruang lingkup pekerjaan dapat dikategorikan sebagai pekerjaan tambahan.',
      'Pekerjaan tambahan akan dievaluasi dan dapat dikenakan biaya serta penyesuaian jadwal.',
    ],
  },
  {
    title: '9. KONTEN DAN MATERI DARI PELANGGAN',
    paragraphs: ['Pelanggan bertanggung jawab menyediakan materi yang diperlukan untuk proses pengembangan, termasuk:'],
    groups: [{
      items: [
        'Logo dan identitas merek.',
        'Teks dan informasi perusahaan.',
        'Foto, video, dan ilustrasi.',
        'Data produk dan layanan.',
        'Dokumen pendukung.',
        'Informasi akun atau akses sistem yang diperlukan.',
      ],
    }],
    closing: [
      'Pelanggan menjamin bahwa materi yang diberikan tidak melanggar hak cipta, merek dagang, privasi, atau hak hukum pihak lain.',
      'SmartNova tidak bertanggung jawab atas klaim hukum yang timbul akibat penggunaan materi yang disediakan pelanggan tanpa hak atau izin yang sah.',
      'Keterlambatan penyediaan materi dapat memengaruhi jadwal penyelesaian proyek.',
    ],
  },
  {
    title: '10. DOMAIN, HOSTING, SERVER, DAN LAYANAN PIHAK KETIGA',
    paragraphs: [
      'Beberapa layanan SmartNova dapat memerlukan infrastruktur tambahan, seperti domain, hosting, VPS, database cloud, layanan API, email profesional, dan payment gateway.',
      'Ketentuan penggunaannya adalah sebagai berikut:',
    ],
    groups: [{
      items: [
        'Biaya infrastruktur mengikuti penyedia layanan yang digunakan.',
        'Masa aktif domain, hosting, dan server mengikuti periode berlangganan masing-masing penyedia.',
        'Perpanjangan layanan menjadi tanggung jawab pihak yang disepakati dalam proposal.',
        'Perubahan kebijakan atau gangguan pada penyedia pihak ketiga berada di luar kendali langsung SmartNova.',
        'Integrasi layanan eksternal hanya dilakukan apabila termasuk dalam ruang lingkup pekerjaan.',
        'Ketersediaan integrasi pembayaran tidak berarti payment gateway telah aktif sebelum proses pendaftaran, konfigurasi, pengujian, dan persetujuan penyedia selesai.',
      ],
    }],
    closing: ['SmartNova tidak menjamin layanan pihak ketiga selalu tersedia tanpa gangguan.'],
  },
  {
    title: '11. PENGUJIAN, SERAH TERIMA, DAN PENYELESAIAN PROYEK',
    paragraphs: [
      'Sebelum proyek dinyatakan selesai, SmartNova akan melakukan pengujian sesuai ruang lingkup dan spesifikasi yang telah disepakati.',
      'Pengujian dapat mencakup:',
    ],
    groups: [{
      items: [
        'Pemeriksaan tampilan website atau aplikasi.',
        'Pengujian fungsi utama.',
        'Pemeriksaan kompatibilitas perangkat.',
        'Pengujian akses dan navigasi.',
        'Pemeriksaan integrasi yang termasuk dalam proyek.',
      ],
    }],
    closing: [
      'Pelanggan diberikan kesempatan untuk melakukan pemeriksaan hasil pekerjaan sebelum serah terima akhir.',
      'Proyek dinyatakan selesai setelah hasil pekerjaan memenuhi ruang lingkup yang disepakati dan proses serah terima dilakukan sesuai ketentuan proyek.',
      'Permintaan pengembangan baru setelah serah terima dapat diproses sebagai layanan tambahan.',
    ],
  },
  {
    title: '12. GARANSI DAN DUKUNGAN TEKNIS',
    paragraphs: [
      'SmartNova dapat menyediakan dukungan teknis dan garansi sesuai jenis produk atau layanan yang dibeli.',
      'Dukungan dapat mencakup:',
    ],
    groups: [{
      items: [
        'Bantuan instalasi dan konfigurasi.',
        'Panduan penggunaan aplikasi.',
        'Penanganan bug atau kesalahan fungsi yang termasuk dalam spesifikasi awal.',
        'Bantuan teknis terkait sistem.',
        'Konsultasi penggunaan produk sesuai ketentuan layanan.',
      ],
    }],
    closing: ['Garansi tidak secara otomatis mencakup:'],
    additionalGroups: [{
      items: [
        'Penambahan fitur baru.',
        'Perubahan desain di luar kesepakatan.',
        'Kerusakan akibat modifikasi oleh pihak lain.',
        'Kesalahan penggunaan oleh pelanggan.',
        'Kerusakan perangkat atau infrastruktur milik pelanggan.',
        'Gangguan layanan pihak ketiga.',
        'Kehilangan data akibat tidak adanya pencadangan.',
      ],
    }],
    finalParagraphs: ['Durasi, cakupan, dan mekanisme dukungan teknis mengikuti ketentuan masing-masing produk atau proposal proyek.'],
  },
  {
    title: '13. KEBIJAKAN PEMBATALAN DAN PENGEMBALIAN DANA',
    paragraphs: [
      'SmartNova berupaya memberikan informasi yang jelas mengenai produk dan layanan sebelum pelanggan melakukan transaksi.',
      'Ketentuan pembatalan dan pengembalian dana mengikuti jenis transaksi, status pengerjaan, serta kesepakatan yang berlaku.',
    ],
    groups: [
      {
        title: 'Untuk pembelian produk digital',
        items: [
          'Pelanggan disarankan memastikan kesesuaian produk sebelum melakukan pembelian.',
          'Permintaan pengembalian dana akan ditinjau berdasarkan kondisi transaksi dan ketentuan produk.',
          'Produk yang telah dikirimkan atau lisensi yang telah diaktifkan tidak otomatis memenuhi syarat pengembalian dana.',
          'Hak pelanggan berdasarkan peraturan perlindungan konsumen tetap berlaku.',
        ],
      },
      {
        title: 'Untuk jasa pengembangan',
        items: [
          'Pembatalan proyek harus disampaikan secara tertulis.',
          'Biaya atas pekerjaan yang telah diselesaikan dapat diperhitungkan berdasarkan progres dan kesepakatan.',
          'Pembayaran untuk pekerjaan yang belum dilakukan akan ditangani berdasarkan ketentuan pembatalan dalam proposal.',
          'Penyelesaian kewajiban kedua belah pihak akan dilakukan secara proporsional dan transparan.',
        ],
      },
    ],
    closing: ['Setiap permintaan pembatalan atau pengembalian dana dapat disampaikan melalui kontak resmi SmartNova.'],
  },
  {
    title: '14. KEPEMILIKAN DAN HAK KEKAYAAN INTELEKTUAL',
    paragraphs: [
      'Seluruh teknologi, framework, kode sumber, komponen umum, template, desain dasar, sistem internal, dan aset yang telah dimiliki atau dikembangkan SmartNova sebelum proyek berlangsung tetap menjadi hak kekayaan intelektual pemiliknya.',
      'Untuk proyek custom, hak penggunaan maupun kepemilikan atas hasil akhir pekerjaan akan ditentukan berdasarkan kesepakatan tertulis.',
      'Apabila pelanggan membeli paket yang tidak mencakup penyerahan source code, maka pelanggan memperoleh hak penggunaan sesuai lisensi yang diberikan, bukan kepemilikan penuh atas kode sumber.',
      'Pelanggan dilarang menggunakan, menggandakan, atau mendistribusikan aset milik SmartNova di luar hak yang telah diberikan.',
    ],
  },
  {
    title: '15. PRIVASI DAN PERLINDUNGAN DATA',
    paragraphs: [
      'SmartNova menghormati privasi pelanggan dan berupaya menjaga keamanan informasi yang diberikan selama proses transaksi maupun penggunaan layanan.',
      'Informasi pelanggan dapat digunakan untuk:',
    ],
    groups: [{
      items: [
        'Memproses pesanan dan transaksi.',
        'Menyediakan produk dan layanan.',
        'Memberikan dukungan teknis.',
        'Mengirimkan informasi terkait layanan.',
        'Memenuhi kewajiban hukum yang berlaku.',
      ],
    }],
    closing: [
      'SmartNova berupaya menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pelanggan.',
      'Pelanggan juga bertanggung jawab menjaga keamanan akun, kata sandi, perangkat, serta informasi akses yang dimiliki.',
      'Pengelolaan data pribadi dilakukan sesuai Kebijakan Privasi SmartNova dan peraturan perlindungan data pribadi yang berlaku di Indonesia.',
    ],
  },
  {
    title: '16. BATASAN TANGGUNG JAWAB',
    paragraphs: [
      'SmartNova berkomitmen memberikan produk dan layanan sesuai spesifikasi yang disepakati.',
      'Namun, SmartNova tidak bertanggung jawab atas kerugian yang timbul akibat:',
    ],
    groups: [{
      items: [
        'Penyalahgunaan produk atau layanan oleh pelanggan.',
        'Kesalahan konfigurasi yang dilakukan pihak lain.',
        'Gangguan jaringan internet atau infrastruktur eksternal.',
        'Gangguan penyedia hosting, server, API, atau layanan pihak ketiga.',
        'Kehilangan data akibat kelalaian pencadangan oleh pengguna.',
        'Penggunaan aplikasi yang tidak sesuai panduan.',
        'Keadaan di luar kendali wajar SmartNova.',
      ],
    }],
    closing: ['Ketentuan ini tidak menghapus tanggung jawab yang wajib dipenuhi berdasarkan hukum yang berlaku.'],
  },
  {
    title: '17. PERUBAHAN DAN PEMBARUAN LAYANAN',
    paragraphs: [
      'SmartNova berhak melakukan pengembangan, peningkatan, pemeliharaan, dan pembaruan terhadap produk maupun layanan untuk meningkatkan kualitas, keamanan, dan pengalaman pengguna.',
      'Perubahan terhadap fitur, harga, paket, dan ketentuan layanan dapat dilakukan sesuai kebutuhan pengembangan bisnis.',
      'Pembaruan yang berdampak terhadap hak penggunaan pelanggan akan mengikuti ketentuan lisensi atau perjanjian yang telah disepakati.',
    ],
  },
  {
    title: '18. KEADAAN KAHAR (FORCE MAJEURE)',
    paragraphs: [
      'SmartNova maupun pelanggan tidak dianggap melakukan pelanggaran apabila terjadi keterlambatan atau kegagalan memenuhi kewajiban akibat keadaan di luar kendali yang wajar.',
      'Keadaan tersebut dapat meliputi bencana alam, kebakaran, gangguan infrastruktur besar, perang, kerusuhan, kebijakan pemerintah, gangguan jaringan berskala luas, atau kondisi lain yang secara wajar tidak dapat dikendalikan.',
      'Pihak yang terdampak akan berupaya memberikan pemberitahuan dan melakukan koordinasi untuk menentukan langkah penyelesaian.',
    ],
  },
  {
    title: '19. HUKUM DAN PENYELESAIAN SENGKETA',
    paragraphs: [
      'Syarat dan Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia.',
      'Apabila terjadi perselisihan antara SmartNova dan pelanggan, kedua belah pihak sepakat untuk mengutamakan penyelesaian melalui komunikasi dan musyawarah secara baik-baik.',
      'Apabila penyelesaian secara musyawarah tidak tercapai, perselisihan dapat diselesaikan melalui mekanisme hukum yang berlaku di Indonesia.',
    ],
  },
  {
    title: '20. PERUBAHAN SYARAT DAN KETENTUAN',
    paragraphs: [
      'SmartNova dapat memperbarui dokumen Syarat dan Ketentuan ini dari waktu ke waktu untuk menyesuaikan perkembangan layanan, kebijakan bisnis, dan peraturan yang berlaku.',
      'Versi terbaru akan dipublikasikan melalui halaman resmi website SmartNova.',
      'Pelanggan disarankan membaca halaman ini secara berkala untuk mengetahui perubahan ketentuan layanan.',
    ],
  },
  {
    title: '21. HUBUNGI SMARTNOVA',
    paragraphs: [
      'Apabila Anda memiliki pertanyaan, membutuhkan klarifikasi, atau ingin berkonsultasi mengenai produk dan layanan SmartNova, silakan hubungi kami melalui saluran komunikasi resmi.',
    ],
    groups: [{
      items: [
        'Website: https://smartnova.site',
        'Email: Gunakan alamat email kontak resmi yang tercantum pada website SmartNova.',
      ],
    }],
    closing: ['Kami siap membantu Anda menemukan solusi teknologi yang tepat untuk kebutuhan pribadi maupun bisnis.'],
  },
];

const refundSections: TermsSection[] = [
  {
    title: '1. PENDAHULUAN',
    paragraphs: [
      'SmartNova berkomitmen memberikan produk digital dan layanan teknologi yang berkualitas, profesional, serta sesuai dengan kebutuhan pelanggan.',
      'Kami memahami bahwa dalam kondisi tertentu, pelanggan mungkin perlu melakukan pembatalan pesanan, perubahan layanan, atau mengajukan pengembalian dana (refund).',
      'Oleh karena itu, kebijakan ini dibuat untuk memberikan kejelasan mengenai prosedur pembatalan, perubahan pesanan, pengembalian dana, serta hak dan kewajiban pelanggan dalam setiap transaksi dengan SmartNova.',
      'Kebijakan ini berlaku untuk seluruh produk dan layanan SmartNova, termasuk pembelian aplikasi digital, lisensi software, jasa pembuatan website, pengembangan aplikasi, dan layanan teknologi lainnya.',
      'Dengan melakukan pemesanan atau pembelian, pelanggan dianggap telah membaca dan memahami kebijakan ini, tanpa mengurangi hak konsumen yang dijamin oleh peraturan perundang-undangan yang berlaku.',
    ],
  },
  {
    title: '2. RUANG LINGKUP KEBIJAKAN',
    paragraphs: ['Kebijakan pembatalan dan pengembalian dana SmartNova mencakup beberapa kategori berikut:'],
    groups: [
      {
        title: 'A. Produk Digital dan Aplikasi',
        items: [
          'Aplikasi kasir SmartNova POS.',
          'Aplikasi kasir restoran.',
          'Aplikasi kasir laundry.',
          'Aplikasi kasir bengkel dan BengkelKu POS.',
          'Aplikasi pengelolaan keuangan keluarga dan kas lingkungan.',
          'Aplikasi manajemen inventaris dan usaha.',
          'Produk software dan aplikasi digital lainnya.',
        ],
      },
      {
        title: 'B. Jasa Pembuatan Website',
        items: [
          'Website Company Profile.',
          'Website Portofolio Profesional.',
          'Website Sekolah.',
          'Website E-Commerce dan Toko Online.',
          'Website Bisnis dan UMKM.',
          'Website Sistem Informasi dan aplikasi berbasis web.',
        ],
      },
      {
        title: 'C. Jasa Pengembangan Software dan Aplikasi',
        items: [
          'Pengembangan aplikasi Android dan mobile.',
          'Pengembangan aplikasi berbasis web.',
          'Pengembangan software custom.',
          'Sistem manajemen bisnis dan administrasi.',
          'Integrasi API dan layanan pihak ketiga.',
          'Pengembangan database dan sistem informasi.',
        ],
      },
      {
        title: 'D. Layanan Tambahan',
        items: [
          'Konsultasi dan perencanaan sistem.',
          'Instalasi dan konfigurasi aplikasi.',
          'Pengelolaan hosting, server, dan domain.',
          'Pemeliharaan dan pengembangan sistem.',
          'Dukungan teknis dan layanan tambahan lainnya.',
        ],
      },
    ],
    closing: ['Ketentuan khusus untuk masing-masing produk atau layanan dapat dijelaskan lebih lanjut dalam proposal, invoice, deskripsi produk, atau perjanjian pembelian.'],
  },
  {
    title: '3. KEBIJAKAN PEMBATALAN PEMBELIAN PRODUK DIGITAL',
    paragraphs: [
      'Produk digital SmartNova mencakup aplikasi, software, dan berbagai produk berbasis teknologi yang dapat dikirimkan melalui unduhan, tautan distribusi, aktivasi lisensi, atau metode penyerahan digital lainnya.',
      'Sebelum melakukan pembelian, pelanggan disarankan untuk mempelajari informasi produk secara menyeluruh, termasuk:',
    ],
    groups: [{
      items: [
        'Deskripsi dan fungsi aplikasi.',
        'Daftar fitur yang tersedia.',
        'Spesifikasi minimum perangkat.',
        'Sistem operasi yang didukung.',
        'Ketentuan lisensi penggunaan.',
        'Kebutuhan koneksi internet.',
        'Batasan dan kompatibilitas aplikasi.',
      ],
    }],
    closing: ['Ketentuan pembatalan:'],
    additionalGroups: [{
      ordered: true,
      items: [
        'Pembatalan sebelum produk dikirimkan atau lisensi diaktifkan dapat diajukan untuk ditinjau oleh SmartNova.',
        'Apabila produk telah dikirimkan, diunduh, atau lisensi telah diaktifkan, permintaan pembatalan dan refund akan dievaluasi berdasarkan kondisi transaksi dan ketentuan produk.',
        'Kesalahan pembelian akibat pelanggan tidak membaca deskripsi, spesifikasi, atau persyaratan produk tidak secara otomatis menjadi dasar persetujuan refund.',
        'Apabila terjadi pembayaran ganda, kesalahan transaksi, atau produk tidak diterima setelah pembayaran terverifikasi, pelanggan berhak mengajukan pemeriksaan dan penyelesaian.',
        'Apabila produk terbukti memiliki kerusakan atau ketidaksesuaian fungsi material terhadap spesifikasi yang dijanjikan, SmartNova akan melakukan pemeriksaan dan menawarkan solusi yang sesuai.',
      ],
    }],
    finalParagraphs: ['SmartNova akan mempertimbangkan setiap permohonan secara objektif dan tidak mengesampingkan hak konsumen berdasarkan peraturan yang berlaku.'],
  },
  {
    title: '4. KEBIJAKAN KHUSUS APLIKASI OFFLINE',
    paragraphs: [
      'Beberapa aplikasi SmartNova dirancang untuk beroperasi secara offline dengan penyimpanan data lokal pada perangkat pengguna.',
      'Pelanggan perlu memahami bahwa aplikasi offline memiliki karakteristik penggunaan tertentu.',
      'Sebelum membeli, pastikan:',
    ],
    groups: [{
      items: [
        'Perangkat memenuhi persyaratan minimum aplikasi.',
        'Sistem operasi kompatibel dengan aplikasi.',
        'Kapasitas penyimpanan perangkat mencukupi.',
        'Pelanggan memahami fitur yang dapat digunakan tanpa internet.',
        'Pelanggan memahami fitur yang tetap memerlukan koneksi internet.',
      ],
    }],
    closing: ['Ketentuan refund aplikasi offline:'],
    additionalGroups: [{
      ordered: true,
      items: [
        'Ketidaktersediaan koneksi internet bukan merupakan alasan refund apabila aplikasi memang dirancang untuk beroperasi secara offline sesuai spesifikasi.',
        'Fitur yang membutuhkan layanan online, API, sinkronisasi, atau layanan eksternal tidak dijamin dapat berfungsi tanpa koneksi internet.',
        'Masalah yang disebabkan oleh perangkat yang tidak kompatibel atau tidak memenuhi spesifikasi tidak secara otomatis memenuhi syarat refund.',
        'Apabila terdapat bug atau kerusakan fungsi yang terbukti berasal dari aplikasi dan tidak sesuai spesifikasi produk, SmartNova akan melakukan pemeriksaan dan memberikan solusi yang sesuai.',
        'Pelanggan dapat mengajukan permohonan penyelesaian apabila produk tidak dapat digunakan sebagaimana mestinya sesuai deskripsi dan ketentuan pembelian.',
      ],
    }],
  },
  {
    title: '5. KEBIJAKAN LISENSI DAN MASA BERLANGGANAN',
    paragraphs: [
      'Produk SmartNova dapat menggunakan sistem lisensi yang berbeda sesuai jenis aplikasi dan paket pembelian.',
      'Beberapa jenis lisensi yang mungkin tersedia meliputi:',
    ],
    groups: [{
      items: [
        'Lisensi sekali bayar (One-Time Purchase).',
        'Lisensi penggunaan jangka panjang.',
        'Lisensi tahunan (Annual License).',
        'Lisensi berdasarkan perangkat.',
        'Lisensi berdasarkan akun atau pengguna.',
        'Lisensi khusus berdasarkan kesepakatan.',
      ],
    }],
    closing: ['Ketentuan pembatalan lisensi:'],
    additionalGroups: [{
      ordered: true,
      items: [
        'Pembatalan lisensi sebelum aktivasi dapat diajukan untuk ditinjau.',
        'Lisensi yang telah diaktifkan akan mengikuti ketentuan pembelian dan perjanjian lisensi masing-masing produk.',
        'Pembayaran lisensi tahunan tidak otomatis dapat dikembalikan secara prorata setelah masa penggunaan dimulai.',
        'Permintaan penghentian perpanjangan lisensi dapat diajukan sebelum periode lisensi berikutnya dimulai sesuai ketentuan produk.',
        'Apabila terjadi kesalahan aktivasi atau pelanggan tidak memperoleh hak penggunaan yang telah dibeli, SmartNova akan melakukan pemeriksaan dan memberikan penyelesaian yang sesuai.',
      ],
    }],
    finalParagraphs: ['Ketentuan lisensi khusus akan diinformasikan sebelum transaksi dilakukan.'],
  },
  {
    title: '6. KEBIJAKAN PEMBATALAN JASA PEMBUATAN WEBSITE',
    paragraphs: [
      'SmartNova menyediakan jasa pengembangan berbagai jenis website, termasuk Company Profile, Portofolio, Website Sekolah, E-Commerce, dan website bisnis lainnya.',
      'Setiap proyek pengembangan website memiliki ruang lingkup, kebutuhan teknis, waktu pengerjaan, dan biaya yang berbeda.',
      'Oleh karena itu, ketentuan pembatalan proyek akan mengikuti proposal atau perjanjian yang telah disetujui kedua belah pihak.',
      'Ketentuan pembatalan proyek:',
    ],
    groups: [{
      ordered: true,
      items: [
        'Pelanggan dapat mengajukan pembatalan secara tertulis sebelum pekerjaan dimulai.',
        'Apabila pekerjaan belum dimulai, pengembalian pembayaran akan dievaluasi berdasarkan status transaksi, biaya administrasi yang sah, serta kesepakatan yang berlaku.',
        'Apabila pekerjaan telah berjalan, biaya yang telah digunakan untuk proses analisis, desain, pengembangan, dan pekerjaan lainnya dapat diperhitungkan berdasarkan progres pekerjaan.',
        'Apabila proyek telah selesai atau hasil pekerjaan telah diserahterimakan, pembatalan tidak secara otomatis memberikan hak pengembalian dana.',
        'Biaya pihak ketiga yang telah dikeluarkan, seperti domain, hosting, server, lisensi, atau layanan eksternal, akan diperhitungkan sesuai sifat biaya dan kesepakatan proyek.',
      ],
    }],
    closing: ['SmartNova akan mengupayakan penyelesaian secara proporsional dan transparan dengan mempertimbangkan pekerjaan yang telah dilakukan serta kewajiban masing-masing pihak.'],
  },
  {
    title: '7. KEBIJAKAN PEMBATALAN JASA PENGEMBANGAN APLIKASI DAN SOFTWARE CUSTOM',
    paragraphs: [
      'Pengembangan aplikasi dan software custom membutuhkan proses perencanaan, analisis, desain, pemrograman, pengujian, dan implementasi.',
      'Setiap proyek dapat memiliki tingkat kompleksitas dan kebutuhan sumber daya yang berbeda.',
      'Apabila pelanggan mengajukan pembatalan, ketentuan berikut akan berlaku:',
    ],
    groups: [{
      items: [
        'Pembatalan sebelum pekerjaan dimulai akan ditinjau berdasarkan kesepakatan awal.',
        'Pembatalan setelah proses analisis atau perancangan dimulai akan memperhitungkan pekerjaan yang telah diselesaikan.',
        'Pembatalan selama tahap pengembangan akan memperhitungkan progres aktual proyek dan biaya yang telah dikeluarkan.',
        'Pekerjaan yang telah selesai dan disetujui tidak otomatis dapat diminta pengembalian dananya.',
        'Biaya lisensi, infrastruktur, atau layanan pihak ketiga yang telah dibayarkan akan diperhitungkan berdasarkan ketentuan penyedia dan kesepakatan proyek.',
      ],
    }],
    closing: ['Apabila proyek dibatalkan, SmartNova dan pelanggan akan melakukan koordinasi mengenai status pekerjaan, kewajiban pembayaran, serta penyerahan hasil pekerjaan yang telah disepakati.'],
  },
  {
    title: '8. PERUBAHAN RUANG LINGKUP DAN SPESIFIKASI PEKERJAAN',
    paragraphs: [
      'SmartNova memahami bahwa kebutuhan pelanggan dapat berubah selama proses pengembangan berlangsung.',
      'Pelanggan dapat mengajukan perubahan atau penambahan kebutuhan, seperti:',
    ],
    groups: [{
      items: [
        'Penambahan fitur baru.',
        'Perubahan desain dan tampilan.',
        'Perubahan alur sistem.',
        'Penambahan modul administrasi.',
        'Integrasi layanan eksternal.',
        'Perubahan teknologi atau infrastruktur.',
        'Penyesuaian fungsi aplikasi.',
      ],
    }],
    closing: [
      'Namun, perubahan yang berada di luar ruang lingkup awal dapat memerlukan biaya tambahan dan penyesuaian jadwal pengerjaan.',
      'Setiap perubahan akan dikomunikasikan terlebih dahulu dan dituangkan dalam kesepakatan tertulis sebelum dilaksanakan.',
      'Perubahan ruang lingkup tidak secara otomatis menjadi dasar pembatalan atau pengembalian dana atas pekerjaan yang telah diselesaikan.',
    ],
  },
  {
    title: '9. KONDISI YANG DAPAT DIPERTIMBANGKAN UNTUK REFUND',
    paragraphs: ['SmartNova akan mempertimbangkan permohonan pengembalian dana apabila terdapat kondisi yang dapat dibuktikan, termasuk tetapi tidak terbatas pada:'],
    groups: [{
      ordered: true,
      items: [
        'Terjadi pembayaran ganda untuk transaksi yang sama.',
        'Pembayaran berhasil tetapi produk atau layanan tidak dapat disediakan oleh SmartNova.',
        'Produk yang diterima secara material berbeda dari spesifikasi yang dijanjikan dan tidak dapat diperbaiki atau diselesaikan melalui solusi yang wajar.',
        'Terjadi kesalahan transaksi yang telah dikonfirmasi oleh SmartNova.',
        'Proyek tidak dapat dilanjutkan karena kendala yang menjadi tanggung jawab SmartNova, sesuai kondisi dan kesepakatan proyek.',
        'Terdapat kondisi lain yang memenuhi ketentuan pengembalian dana berdasarkan peraturan yang berlaku.',
      ],
    }],
    closing: ['Setiap pengajuan akan melalui proses verifikasi agar penyelesaiannya adil bagi pelanggan maupun SmartNova.'],
  },
  {
    title: '10. KONDISI YANG TIDAK SECARA OTOMATIS MEMENUHI SYARAT REFUND',
    paragraphs: [
      'Permohonan pengembalian dana dapat ditolak apabila alasan yang diajukan tidak memiliki dasar yang sesuai dengan ketentuan transaksi.',
      'Beberapa kondisi yang tidak secara otomatis memenuhi syarat refund antara lain:',
    ],
    groups: [{
      items: [
        'Perubahan keinginan atau preferensi pelanggan setelah pembelian.',
        'Kesalahan memilih produk akibat tidak mempelajari deskripsi dan spesifikasi.',
        'Ketidakcocokan perangkat yang tidak memenuhi persyaratan minimum.',
        'Ketidakmampuan menggunakan fitur karena kurang memahami panduan penggunaan.',
        'Gangguan jaringan internet atau layanan pihak ketiga yang berada di luar kendali SmartNova.',
        'Kerusakan akibat modifikasi atau penggunaan aplikasi yang tidak sesuai ketentuan.',
        'Permintaan pembatalan setelah pekerjaan selesai sesuai ruang lingkup yang disepakati.',
      ],
    }],
    closing: ['Namun, ketentuan tersebut tidak menghilangkan hak pelanggan apabila terdapat kegagalan layanan, ketidaksesuaian produk, atau kewajiban lain yang harus dipenuhi berdasarkan hukum yang berlaku.'],
  },
  {
    title: '11. PROSEDUR PENGAJUAN PEMBATALAN DAN REFUND',
    paragraphs: [
      'Pelanggan yang ingin mengajukan pembatalan atau pengembalian dana dapat menghubungi SmartNova melalui saluran komunikasi resmi.',
      'Untuk mempercepat proses pemeriksaan, pelanggan disarankan menyertakan informasi berikut:',
    ],
    groups: [
      {
        title: 'Informasi yang diperlukan',
        items: [
          'Nama pelanggan.',
          'Nomor pesanan atau invoice.',
          'Nama produk atau layanan.',
          'Tanggal transaksi.',
          'Bukti pembayaran.',
          'Alasan pembatalan atau pengajuan refund.',
          'Bukti pendukung apabila terdapat masalah pada produk atau layanan.',
        ],
      },
      {
        title: 'Tahapan pengajuan',
        ordered: true,
        items: [
          'Pelanggan menghubungi SmartNova melalui kontak resmi.',
          'Pelanggan menyampaikan informasi transaksi dan alasan pengajuan.',
          'SmartNova melakukan verifikasi pembayaran dan pemeriksaan kondisi produk atau progres pekerjaan.',
          'SmartNova memberikan informasi hasil pemeriksaan dan solusi yang dapat diberikan.',
          'Apabila refund disetujui, proses pengembalian dana dilakukan melalui metode yang disepakati.',
        ],
      },
    ],
    closing: ['SmartNova dapat meminta informasi tambahan apabila diperlukan untuk memastikan keabsahan pengajuan.'],
  },
  {
    title: '12. WAKTU DAN MEKANISME PENGEMBALIAN DANA',
    paragraphs: [
      'Apabila permohonan refund disetujui, pengembalian dana akan diproses melalui metode pembayaran awal atau metode lain yang disepakati oleh kedua belah pihak.',
      'Ketentuan pengembalian dana meliputi:',
    ],
    groups: [{
      items: [
        'Jumlah dana yang dikembalikan ditentukan berdasarkan hasil pemeriksaan dan kesepakatan.',
        'Biaya pihak ketiga yang tidak dapat dikembalikan dapat diperhitungkan apabila telah diinformasikan dan disepakati sebelumnya.',
        'Waktu penerimaan dana dapat berbeda tergantung metode pembayaran dan kebijakan penyedia layanan keuangan.',
        'SmartNova akan memberikan informasi mengenai status proses refund kepada pelanggan.',
      ],
    }],
    closing: ['Estimasi waktu penyelesaian akan diinformasikan setelah permohonan disetujui dan seluruh informasi yang diperlukan telah diverifikasi.'],
  },
  {
    title: '13. PEMBAYARAN MELALUI PIHAK KETIGA',
    paragraphs: [
      'Apabila transaksi dilakukan melalui payment gateway, transfer bank, atau penyedia layanan pembayaran lainnya, proses refund dapat mengikuti prosedur tambahan dari penyedia tersebut.',
      'SmartNova tidak bertanggung jawab atas keterlambatan yang sepenuhnya disebabkan oleh proses internal penyedia pembayaran, tetapi akan membantu pelanggan melakukan koordinasi sesuai kemampuan dan akses yang tersedia.',
    ],
  },
  {
    title: '14. PENCEGAHAN PENYALAHGUNAAN KEBIJAKAN REFUND',
    paragraphs: ['SmartNova berhak melakukan pemeriksaan tambahan apabila ditemukan indikasi:'],
    groups: [{
      items: [
        'Penyalahgunaan sistem pengembalian dana.',
        'Manipulasi bukti pembayaran.',
        'Pengajuan refund berulang yang tidak wajar.',
        'Penggunaan produk secara tidak sah.',
        'Aktivitas transaksi yang mengindikasikan penipuan.',
      ],
    }],
    closing: [
      'Setiap tindakan akan ditangani secara objektif berdasarkan bukti dan ketentuan yang berlaku.',
      'SmartNova tidak akan menggunakan ketentuan ini untuk menghalangi pelanggan mengajukan keluhan atau menggunakan hak konsumen yang dijamin oleh hukum.',
    ],
  },
  {
    title: '15. HAK DAN PERLINDUNGAN KONSUMEN',
    paragraphs: [
      'SmartNova menghormati hak pelanggan untuk memperoleh informasi yang benar, jelas, dan jujur mengenai produk serta layanan yang ditawarkan.',
      'Kebijakan ini disusun dengan memperhatikan ketentuan peraturan perlindungan konsumen dan peraturan lain yang berlaku di Republik Indonesia.',
      'Apabila terdapat perbedaan antara kebijakan ini dan ketentuan hukum yang bersifat wajib, maka ketentuan hukum yang berlaku akan diutamakan.',
      'Pelanggan tetap memiliki hak untuk menyampaikan pengaduan dan memperoleh penyelesaian sesuai peraturan yang berlaku.',
    ],
  },
  {
    title: '16. PERUBAHAN KEBIJAKAN',
    paragraphs: [
      'SmartNova dapat memperbarui Kebijakan Pembatalan dan Pengembalian Dana ini dari waktu ke waktu untuk menyesuaikan perkembangan produk, layanan, dan ketentuan hukum.',
      'Setiap pembaruan akan dipublikasikan melalui halaman resmi website SmartNova.',
      'Ketentuan yang berlaku untuk transaksi tertentu tetap memperhatikan proposal, perjanjian, atau ketentuan pembelian yang telah disepakati sebelumnya, sepanjang tidak bertentangan dengan peraturan perundang-undangan.',
    ],
  },
  {
    title: '17. HUBUNGI SMARTNOVA',
    paragraphs: [
      'Apabila Anda memiliki pertanyaan mengenai pembatalan pesanan, pengembalian dana, lisensi produk, atau layanan pengembangan, silakan hubungi SmartNova melalui saluran komunikasi resmi.',
    ],
    groups: [{
      items: [
        'Website: https://smartnova.site',
        'Email: Gunakan alamat email kontak resmi yang tercantum pada website SmartNova.',
      ],
    }],
    closing: ['Kami siap membantu memberikan informasi dan solusi terbaik untuk setiap kebutuhan Anda.'],
  },
];

export function BusinessPage({ page, service, onNavigate }: BusinessPageProps) {
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [conceptProjects, setConceptProjects] = useState<PortfolioProject[] | typeof portfolioExamples>(portfolioExamples);
  const [portfolioError, setPortfolioError] = useState('');

  useEffect(() => {
    if (page !== 'portfolio') return;
    let active = true;
    void supabase.from('portfolio_projects').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setPortfolioError('Proyek yang dipublikasikan belum dapat dimuat. Demo konsep tetap ditampilkan.');
          setPortfolio([]);
          setConceptProjects(portfolioExamples);
          return;
        }
        const projects = (data as PortfolioProject[] | null) ?? [];
        setPortfolio(projects.filter((project) => !project.is_concept));
        const concepts = projects.filter((project) => project.is_concept);
        setConceptProjects(concepts.length ? concepts : portfolioExamples);
      });
    return () => { active = false; };
  }, [page]);

  const whatsappUrl = getWhatsAppUrl(service
    ? `Halo SmartNova, saya ingin berkonsultasi tentang paket ${service}.`
    : 'Halo SmartNova, saya ingin berkonsultasi tentang proyek digital.');

  if (page === 'services') {
    return (
      <div className="business-page">
        <section className="business-page-hero">
          <div className="site-container">
            <span className="section-kicker">JASA SMARTNOVA</span>
            <h1>Solusi digital, dengan ruang lingkup yang jelas.</h1>
            <p>Pilih paket sebagai titik awal. Kebutuhan, biaya akhir, jadwal, dan dukungan dibahas sebelum proposal disepakati.</p>
            <button className="button button-primary" onClick={() => onNavigate('contact')}>Minta penawaran <ArrowRight size={16} /></button>
          </div>
        </section>
        <section className="section section-light">
          <div className="site-container">
            <div className="section-heading"><div><span className="section-kicker">PAKET JASA</span><h2>Pilih titik awal Anda</h2><p>Semua harga merupakan indikasi awal, bukan penawaran final.</p></div></div>
            <div className="service-package-grid">
              {servicePackages.map((item) => (
                <article className="service-package-card" key={item.name}>
                  <span className="package-icon"><Code2 size={19} /></span>
                  <h3>{item.name}</h3><p>{item.description}</p>
                  <div className="package-price"><small>Mulai dari</small><strong>{item.price}</strong>{item.cadence && <small>{item.cadence}</small>}</div>
                  <ul>{item.includes.map((entry) => <li key={entry}><BadgeCheck size={14} />{entry}</li>)}</ul>
                  <p className="package-terms">Durasi, batas revisi, pengecualian, dan dukungan akan dicantumkan dalam proposal sesuai kebutuhan.</p>
                  <button className="button button-primary package-cta" onClick={() => {
                    trackEvent('click_service_cta', { service: item.name });
                    onNavigate('contact', { service: item.name });
                  }}>Minta penawaran <ArrowRight size={15} /></button>
                </article>
              ))}
            </div>
            <p className="pricing-disclaimer">Harga final dapat berubah sesuai kompleksitas, revisi, integrasi, domain/hosting, lisensi, pajak, biaya pihak ketiga, dan dukungan purnajual.</p>
          </div>
        </section>
        <section className="section">
          <div className="site-container">
            <div className="section-heading"><div><span className="section-kicker">PROSES KERJA</span><h2>Langkah yang transparan</h2></div></div>
            <div className="process-grid">{workSteps.map(([number, title, detail]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
          </div>
        </section>
      </div>
    );
  }

  if (page === 'portfolio') {
    return (
      <div className="business-page">
        <section className="business-page-hero">
          <div className="site-container"><span className="section-kicker">PORTOFOLIO & DEMO</span><h1>Jelajahi contoh solusi digital.</h1><p>Lihat ide antarmuka untuk berbagai kebutuhan bisnis. Demo konsep ditandai dengan jelas; proyek klien yang dipublikasikan ditampilkan terpisah.</p></div>
        </section>
        <section className="section portfolio-page-list">
          <div className="site-container">
            {portfolioError && <p className="content-notice" role="status">{portfolioError}</p>}
            {portfolio.length > 0 && (
              <>
                <div className="portfolio-list-heading">
                  <span className="section-kicker">PROYEK YANG DIPUBLIKASIKAN</span>
                  <h2>Proyek SmartNova</h2>
                </div>
                <div className="portfolio-grid">
                  {portfolio.map((project, index) => <PortfolioCard key={project.id} project={project} index={index} />)}
                </div>
              </>
            )}
            <div className="portfolio-list-heading concept-list-heading">
              <span className="section-kicker">DEMO ILUSTRATIF · BUKAN PROYEK KLIEN</span>
              <h2>Contoh konsep produk</h2>
              <p>Contoh visual untuk menunjukkan jenis solusi yang dapat dirancang. Bukan bukti proyek yang telah dikerjakan.</p>
            </div>
            <div className="portfolio-grid">
              {conceptProjects.map((project, index) => <PortfolioCard key={project.id} project={project} index={index} />)}
            </div>
            <div className="business-bottom-cta"><button className="button button-primary" onClick={() => onNavigate('contact')}>Buat proyek serupa <ArrowRight size={16} /></button></div>
          </div>
        </section>
      </div>
    );
  }

  if (page === 'about') {
    return (
      <div className="business-page">
        <section className="business-page-hero">
          <div className="site-container"><span className="section-kicker">TENTANG SMARTNOVA</span><h1>Build Smarter. Grow Faster.</h1><p>SmartNova menghadirkan produk digital dan layanan software engineering untuk membantu individu dan UMKM bekerja lebih efisien.</p></div>
        </section>
        <section className="section section-light"><div className="site-container about-grid">
          <article><ShieldCheck size={23} /><h2>Transparan</h2><p>Ruang lingkup, harga, lisensi, dan dukungan dijelaskan agar pelanggan dapat mengambil keputusan dengan informasi yang cukup.</p></article>
          <article><Code2 size={23} /><h2>Praktis</h2><p>Produk dan layanan dijelaskan dengan bahasa yang mudah dipahami dan berangkat dari kebutuhan yang nyata.</p></article>
          <article><Headphones size={23} /><h2>Kolaboratif</h2><p>Setiap proyek dimulai dengan memahami alur kerja, prioritas, serta hasil yang ingin dicapai bersama.</p></article>
        </div></section>
        <section className="section"><div className="site-container about-process"><span className="section-kicker">CARA KAMI BEKERJA</span><h2>Mulai dari kebutuhan, bukan asumsi.</h2><p>Tim SmartNova meninjau kebutuhan, mendiskusikan ruang lingkup, lalu mengirimkan proposal. Pekerjaan dimulai setelah biaya, jadwal, dan kriteria penerimaan disepakati.</p><button className="button button-primary" onClick={() => onNavigate('contact')}>Hubungi kami <ArrowRight size={16} /></button></div></section>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="business-page">
        <section className="business-page-hero">
          <div className="site-container"><span className="section-kicker">KONTAK</span><h1>Mari bahas kebutuhan Anda.</h1><p>Ceritakan rencana, target waktu, dan konteks bisnis Anda. Informasi ini membantu kami meninjau permintaan awal.</p></div>
        </section>
        <section className="section section-light"><div className="site-container contact-layout">
          <div className="contact-aside"><span className="section-kicker">MULAI DI SINI</span><h2>Permintaan konsultasi</h2><p>Formulir ini mengirimkan ringkasan kebutuhan kepada SmartNova. Hindari mengirimkan kata sandi atau data sensitif.</p>
            {businessEmail && <a className="contact-detail" href={`mailto:${businessEmail}`}><ArrowUpRight size={16} />{businessEmail}</a>}
            {whatsappUrl ? <a className="contact-detail" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('click_whatsapp', { source: 'contact' })}><MessageCircle size={16} />Hubungi melalui WhatsApp</a> : <p className="contact-config-note">WhatsApp belum dikonfigurasi. Gunakan formulir ini untuk menghubungi kami.</p>}
            <div className="contact-privacy"><ShieldCheck size={18} /><span>Data hanya digunakan untuk menindaklanjuti konsultasi sesuai kebijakan privasi SmartNova.</span></div>
          </div>
          <div className="lead-form-card"><LeadForm initialService={service} /></div>
        </div></section>
      </div>
    );
  }

  if (page === 'privacy') {
    return (
      <div className="business-page">
        <section className="section section-light legal-page">
          <div className="site-container">
            <button className="text-link" onClick={() => onNavigate('home')}><ArrowLeft size={16} /> Kembali ke beranda</button>
            <span className="section-kicker">INFORMASI SMARTNOVA</span>
            <h1>KEBIJAKAN PRIVASI</h1>
            <p className="legal-updated">Terakhir diperbarui: November 2026</p>
            <div className="legal-policy">
              {privacySections.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.items && (
                    <ul>
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                </section>
              ))}
            </div>
            <button className="button button-primary legal-contact-button" onClick={() => onNavigate('contact')}>Hubungi SmartNova <ArrowRight size={16} /></button>
          </div>
        </section>
      </div>
    );
  }

  if (page === 'terms') {
    return (
      <div className="business-page">
        <section className="section section-light legal-page">
          <div className="site-container">
            <button className="text-link" onClick={() => onNavigate('home')}><ArrowLeft size={16} /> Kembali ke beranda</button>
            <span className="section-kicker">INFORMASI SMARTNOVA</span>
            <h1>SYARAT DAN KETENTUAN LAYANAN</h1>
            <h2 className="legal-subtitle">SMARTNOVA – Terms of Service</h2>
            <p className="legal-updated">Terakhir diperbarui: 8 November 2026</p>
            <div className="legal-policy">
              <p>Selamat datang di SmartNova.</p>
              <p>SmartNova merupakan penyedia produk digital dan layanan pengembangan teknologi yang berfokus pada solusi perangkat lunak, aplikasi, serta pengembangan website untuk individu, profesional, UMKM, dan perusahaan.</p>
              <p>Kami berkomitmen memberikan solusi teknologi yang profesional, transparan, dan sesuai dengan kebutuhan pelanggan.</p>
              <p>Dengan mengakses website, membeli produk, menggunakan aplikasi, atau memesan layanan SmartNova, Anda dianggap telah membaca, memahami, dan menyetujui ketentuan yang berlaku dalam dokumen ini.</p>
              {termsSections.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.groups?.map((group, index) => (
                    <div className="legal-list-group" key={`${section.title}-group-${index}`}>
                      {group.title && <h3>{group.title}</h3>}
                      {group.ordered
                        ? <ol>{group.items.map((item) => (
                          <li key={item}>
                            {item === 'Website: https://smartnova.site'
                              ? <>Website: <a href="https://smartnova.site">https://smartnova.site</a></>
                              : item}
                          </li>
                        ))}</ol>
                        : <ul>{group.items.map((item) => (
                          <li key={item}>
                            {item === 'Website: https://smartnova.site'
                              ? <>Website: <a href="https://smartnova.site">https://smartnova.site</a></>
                              : item}
                          </li>
                        ))}</ul>}
                    </div>
                  ))}
                  {section.closing?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.additionalGroups?.map((group, index) => (
                    <div className="legal-list-group" key={`${section.title}-additional-${index}`}>
                      {group.title && <h3>{group.title}</h3>}
                      {group.ordered
                        ? <ol>{group.items.map((item) => <li key={item}>{item}</li>)}</ol>
                        : <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                    </div>
                  ))}
                  {section.finalParagraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
              ))}
            </div>
            <p className="legal-signoff"><strong>SMARTNOVA – Your Digital Business Partner.</strong><br /><em>Solusi Digital untuk Bisnis yang Lebih Cerdas, Modern, dan Berkembang.</em></p>
            <button className="button button-primary legal-contact-button" onClick={() => onNavigate('contact')}>Hubungi SmartNova <ArrowRight size={16} /></button>
          </div>
        </section>
      </div>
    );
  }

  if (page === 'refund') {
    return (
      <div className="business-page">
        <section className="section section-light legal-page">
          <div className="site-container">
            <button className="text-link" onClick={() => onNavigate('home')}><ArrowLeft size={16} /> Kembali ke beranda</button>
            <span className="section-kicker">INFORMASI SMARTNOVA</span>
            <h1>KEBIJAKAN PEMBATALAN DAN PENGEMBALIAN DANA</h1>
            <h2 className="legal-subtitle">SMARTNOVA – Cancellation &amp; Refund Policy</h2>
            <p className="legal-updated">Terakhir diperbarui: 8 November 2026</p>
            <div className="legal-policy">
              {refundSections.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.groups?.map((group, index) => (
                    <div className="legal-list-group" key={`${section.title}-group-${index}`}>
                      {group.title && <h3>{group.title}</h3>}
                      {group.ordered
                        ? <ol>{group.items.map((item) => <li key={item}>{item}</li>)}</ol>
                        : <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                    </div>
                  ))}
                  {section.closing?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.additionalGroups?.map((group, index) => (
                    <div className="legal-list-group" key={`${section.title}-additional-${index}`}>
                      {group.title && <h3>{group.title}</h3>}
                      {group.ordered
                        ? <ol>{group.items.map((item) => <li key={item}>{item}</li>)}</ol>
                        : <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                    </div>
                  ))}
                  {section.finalParagraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
              ))}
            </div>
            <p className="legal-signoff"><strong>SMARTNOVA – Your Digital Business Partner.</strong><br /><em>Solusi Digital untuk Bisnis yang Lebih Cerdas, Modern, dan Berkembang.</em></p>
            <button className="button button-primary legal-contact-button" onClick={() => onNavigate('contact')}>Hubungi SmartNova <ArrowRight size={16} /></button>
          </div>
        </section>
      </div>
    );
  }

  return <div className="business-page"><section className="section section-light not-found"><div className="site-container"><span className="section-kicker">404</span><h1>Halaman tidak ditemukan.</h1><p>Alamat yang Anda buka tidak tersedia.</p><button className="button button-primary" onClick={() => onNavigate('home')}>Kembali ke beranda <ArrowRight size={16} /></button></div></section></div>;
}
