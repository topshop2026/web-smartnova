import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'id' | 'en';

const translations: Record<string, string> = {
  'Flash Sale: Up to 50% off all digital products — Limited time only!':
    'Flash Sale: Diskon hingga 50% untuk semua produk digital — Waktu terbatas!',
  'Search digital products...': 'Cari produk digital...',
  Home: 'Beranda',
  Catalog: 'Katalog',
  Bestsellers: 'Terlaris',
  'New Arrivals': 'Produk Terbaru',
  'Order History': 'Riwayat Pemesanan',
  Chat: 'Chat',
  Account: 'Akun',
  'Sign in': 'Masuk',
  Admin: 'Admin',
  'Admin pricing': 'Harga Admin',
  Menu: 'Menu',
  Categories: 'Kategori',
  Shop: 'Belanja',
  'All Products': 'Semua Produk',
  Featured: 'Unggulan',
  Company: 'Perusahaan',
  'About Us': 'Tentang Kami',
  Blog: 'Blog',
  Careers: 'Karier',
  Contact: 'Kontak',
  Support: 'Bantuan',
  'Help Center': 'Pusat Bantuan',
  'Terms of Service': 'Syarat Layanan',
  'Privacy Policy': 'Kebijakan Privasi',
  'Refund Policy': 'Kebijakan Pengembalian Dana',
  'Your premier destination for premium digital products. Templates, UI kits, courses, graphics, and more — all in one place.':
    'Destinasi utama untuk produk digital premium. Template, UI kit, kursus, grafik, dan lainnya — semua di satu tempat.',
  'Secure payments': 'Pembayaran aman',
  'Instant download': 'Unduh instan',
  'Lifetime updates': 'Pembaruan seumur hidup',
  'Lifetime Updates': 'Pembaruan Seumur Hidup',
  'All rights reserved.': 'Hak cipta dilindungi.',
  'Over {count}+ premium digital products': 'Lebih dari {count} produk digital premium',
  'Premium Digital Products': 'Produk Digital Premium',
  'for Creators & Builders': 'untuk Kreator & Pengembang',
  'Discover thousands of high-quality templates, UI kits, courses, graphics, and software. Download instantly and elevate your projects today.':
    'Temukan ribuan template, UI kit, kursus, grafik, dan perangkat lunak berkualitas. Unduh langsung dan tingkatkan proyek Anda hari ini.',
  'Browse Products': 'Jelajahi Produk',
  'View Bestsellers': 'Lihat Produk Terlaris',
  'Instant Download': 'Unduh Instan',
  'Secure Checkout': 'Pembayaran Aman',
  'Customer Support': 'Dukungan Pelanggan',
  'Browse by Category': 'Jelajahi Kategori',
  'Find exactly what you need': 'Temukan yang Anda butuhkan',
  'View All': 'Lihat Semua',
  'Featured Products': 'Produk Unggulan',
  'Hand-picked by our team': 'Pilihan khusus dari tim kami',
  'Instant Delivery': 'Pengiriman Instan',
  'Download your products immediately after purchase. No waiting, no shipping costs.':
    'Unduh produk Anda segera setelah pembelian. Tanpa menunggu dan tanpa biaya pengiriman.',
  'Quality Guaranteed': 'Kualitas Terjamin',
  'Every product is reviewed by our team. Not satisfied? Get a full refund within 14 days.':
    'Setiap produk ditinjau oleh tim kami. Tidak puas? Dapatkan pengembalian dana penuh dalam 14 hari.',
  'Buy once and get free lifetime updates. Always have access to the latest versions.':
    'Beli sekali dan dapatkan pembaruan gratis seumur hidup. Selalu akses versi terbaru.',
  'Our most popular products': 'Produk kami yang paling populer',
  'Fresh products just added': 'Produk baru saja ditambahkan',
  'Join thousands of satisfied creators': 'Bergabunglah dengan ribuan kreator yang puas',
  'Trusted by designers, developers, and entrepreneurs worldwide':
    'Dipercaya oleh desainer, pengembang, dan wirausahawan di seluruh dunia',
  'Digital Products': 'Produk Digital',
  'Happy Customers': 'Pelanggan Puas',
  'Average Rating': 'Rating Rata-rata',
  Satisfaction: 'Kepuasan',
  'Start Shopping': 'Mulai Belanja',
  'Product Catalog': 'Katalog Produk',
  'Browse our collection of premium digital products':
    'Jelajahi koleksi produk digital premium kami',
  All: 'Semua',
  'Most Popular': 'Paling Populer',
  Newest: 'Terbaru',
  'Price: Low to High': 'Harga: Terendah ke Tertinggi',
  'Price: High to Low': 'Harga: Tertinggi ke Terendah',
  'Top Rated': 'Rating Tertinggi',
  'All Prices': 'Semua Harga',
  'Under {price}': 'Di bawah {price}',
  'Over {price}': 'Di atas {price}',
  Filters: 'Filter',
  'All Categories': 'Semua Kategori',
  'Price Range': 'Rentang Harga',
  'Clear Filters': 'Hapus Filter',
  'Showing results for': 'Hasil pencarian untuk',
  Clear: 'Hapus',
  'Loading...': 'Memuat...',
  'Loading products...': 'Memuat produk...',
  'No products found': 'Produk tidak ditemukan',
  'Try adjusting your filters or search terms':
    'Coba sesuaikan filter atau kata kunci pencarian Anda',
  New: 'Baru',
  Bestseller: 'Terlaris',
  'Out of stock': 'Stok habis',
  Details: 'Detail',
  Unavailable: 'Tidak tersedia',
  Add: 'Tambah',
  sales: 'terjual',
  'Your cart is empty': 'Keranjang Anda kosong',
  'Browse our catalog and add some digital products to get started.':
    'Jelajahi katalog dan tambahkan produk digital untuk memulai.',
  'Continue Shopping': 'Lanjut Belanja',
  Subtotal: 'Subtotal',
  'Digital products are delivered instantly after checkout.':
    'Produk digital dikirim secara instan setelah pembayaran.',
  'Proceed to Checkout': 'Lanjut ke Pembayaran',
  Cart: 'Keranjang',
  'Select language': 'Pilih bahasa',
  'Add to cart': 'Tambah ke Keranjang',
  'Chat admin about': 'Chat admin tentang',
  'Order Confirmed!': 'Pesanan Dikonfirmasi!',
  'Thank you for your purchase. Your payment has been confirmed and your order is complete.':
    'Terima kasih atas pembelian Anda. Pembayaran telah dikonfirmasi dan pesanan selesai.',
  'Order Number': 'Nomor Pesanan',
  Email: 'Email',
  'Download links sent to your email': 'Tautan unduhan dikirim ke email Anda',
  'Your payment is confirmed. Order fulfillment details will be sent to {email}.':
    'Pembayaran Anda telah dikonfirmasi. Detail pesanan akan dikirim ke {email}.',
  'Add some products before checking out.': 'Tambahkan produk sebelum melanjutkan pembayaran.',
  'Sign in to continue': 'Masuk untuk melanjutkan',
  'Orders are linked to your account for payment and review verification.':
    'Pesanan terhubung ke akun Anda untuk pembayaran dan verifikasi ulasan.',
  'Sign in or create account': 'Masuk atau buat akun',
  'Back to Shopping': 'Kembali Belanja',
  Checkout: 'Pembayaran',
  'Customer Information': 'Informasi Pelanggan',
  'Full Name': 'Nama Lengkap',
  'Receipt email': 'Email tanda terima',
  'Confirmation is sent after successful payment.': 'Konfirmasi dikirim setelah pembayaran berhasil.',
  'I agree to receive payment confirmation via WhatsApp.':
    'Saya setuju menerima konfirmasi pembayaran melalui WhatsApp.',
  'Secure payment with Midtrans': 'Pembayaran aman dengan Midtrans',
  "Payment details are entered on Midtrans's secure checkout page.":
    'Detail pembayaran dimasukkan di halaman pembayaran aman Midtrans.',
  'Continue payment': 'Lanjutkan pembayaran',
  'Payment {order} is still pending.': 'Pembayaran {order} masih tertunda.',
  'Processing...': 'Memproses...',
  'Complete Purchase — {price}': 'Selesaikan Pembelian — {price}',
  'Order Summary': 'Ringkasan Pesanan',
  Tax: 'Pajak',
  Delivery: 'Pengiriman',
  'Instant — Free': 'Instan — Gratis',
  Total: 'Total',
  'Instant download after purchase': 'Unduh instan setelah pembelian',
  'Back to store': 'Kembali ke toko',
  'Password updated': 'Kata sandi diperbarui',
  'Your password has been reset successfully.': 'Kata sandi Anda berhasil diatur ulang.',
  Continue: 'Lanjutkan',
  Administrator: 'Administrator',
  'Customer account': 'Akun pelanggan',
  'Open admin dashboard': 'Buka dasbor admin',
  'Sign out': 'Keluar',
  'Create account': 'Buat akun',
  'Forgot password': 'Lupa kata sandi',
  'Reset password': 'Atur ulang kata sandi',
  'Enter your email address and we will send you a reset link.':
    'Masukkan alamat email dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.',
  'Choose a new password for your account.': 'Pilih kata sandi baru untuk akun Anda.',
  'Sign in to check out and manage your product reviews.':
    'Masuk untuk membayar dan mengelola ulasan produk Anda.',
  Password: 'Kata Sandi',
  'New password': 'Kata sandi baru',
  'Confirm new password': 'Konfirmasi kata sandi baru',
  'Please wait...': 'Mohon tunggu...',
  'Send reset link': 'Kirim tautan pengaturan ulang',
  'Update password': 'Perbarui kata sandi',
  'Forgot password?': 'Lupa kata sandi?',
  'Passwords do not match.': 'Kata sandi tidak cocok.',
  'Registration received. Check your email if confirmation is enabled.':
    'Pendaftaran diterima. Periksa email Anda jika konfirmasi diaktifkan.',
  'If an account exists for this email, a password reset link has been sent.':
    'Jika akun dengan email ini tersedia, tautan pengaturan ulang kata sandi telah dikirim.',
  'Payment successful': 'Pembayaran berhasil',
  'Payment failed': 'Pembayaran gagal',
  Expired: 'Kedaluwarsa',
  Refunded: 'Dana dikembalikan',
  'Awaiting payment': 'Menunggu pembayaran',
  'Checking your account...': 'Memeriksa akun...',
  'Sign in to view your orders.': 'Masuk ke akun untuk melihat pesanan Anda.',
  'Orders for': 'Pesanan untuk',
  'Loading orders...': 'Memuat pesanan...',
  'No orders yet.': 'Belum ada pesanan.',
  'Order history could not be loaded. Please try again.':
    'Riwayat pesanan tidak dapat dimuat. Silakan coba lagi.',
  'Progress:': 'Progres:',
  'Payment is not yet confirmed.': 'Pembayaran belum terkonfirmasi.',
  'Open the Midtrans page, select QRIS, then scan the QR code to pay.':
    'Buka halaman Midtrans, pilih QRIS, lalu pindai kode QR untuk membayar.',
  'Pay with QRIS': 'Bayar dengan QRIS',
  'Qty:': 'Jumlah:',
  'Sign in and enter your name before continuing.':
    'Masuk dan masukkan nama Anda sebelum melanjutkan.',
  'Enter a valid WhatsApp number, for example 081234567890.':
    'Masukkan nomor WhatsApp yang valid, misalnya 081234567890.',
  'Please agree to receive your payment confirmation on WhatsApp.':
    'Setujui penerimaan konfirmasi pembayaran melalui WhatsApp.',
  'John Doe': 'Nama Lengkap',
  'Loading account...': 'Memuat akun...',
  'New here? Create an account': 'Pengguna baru? Buat akun',
  'Back to sign in': 'Kembali ke masuk',
  'Submitting...': 'Mengirim...',
  'Submit Review': 'Kirim Ulasan',
  'You have already reviewed this product.': 'Anda sudah mengulas produk ini.',
  'Reviews are available after this product has a completed purchase on your account.':
    'Ulasan tersedia setelah produk ini selesai dibeli melalui akun Anda.',
  'Sign in to check review eligibility.': 'Masuk untuk memeriksa kelayakan ulasan.',
  'Back to Catalog': 'Kembali ke Katalog',
  'A completed purchase of this product is required to leave a review.':
    'Anda harus menyelesaikan pembelian produk ini untuk memberikan ulasan.',
  'Please fill in your name and comment.': 'Silakan isi nama dan komentar Anda.',
  'Failed to submit review. Please try again.': 'Gagal mengirim ulasan. Silakan coba lagi.',
  Qty: 'Jml',
  'Work duration': 'Waktu pengerjaan',
  'Additional features': 'Fitur tambahan',
  Product: 'Produk',
  'Standard duration': 'Durasi standar',
  'Chat Admin': 'Chat Admin',
  'Sign in to ask about products and view admin replies.':
    'Masuk ke akun untuk bertanya tentang produk dan melihat balasan admin.',
  Conversations: 'Percakapan',
  'Loading chat...': 'Memuat chat...',
  'No conversations yet.': 'Belum ada percakapan.',
  'Send the first message to start a conversation.': 'Kirim pesan pertama untuk memulai percakapan.',
  'Add attachment': 'Tambah lampiran',
  'Write a message...': 'Tulis pesan...',
  'Send message': 'Kirim pesan',
  'This conversation is closed.': 'Percakapan ini sudah ditutup.',
  'Ask the admin about this product': 'Tanya admin tentang produk ini',
  'Conversations are saved to your account, so you can return to view replies anytime.':
    'Percakapan tersimpan di akun Anda, jadi Anda dapat kembali melihat balasan kapan saja.',
  reviews: 'ulasan',
  'File Type': 'Jenis File',
  'File Size': 'Ukuran File',
  Sales: 'Penjualan',
  Instant: 'Instan',
  'Write a Review': 'Tulis Ulasan',
  'Your name': 'Nama Anda',
  'Share your thoughts about this product...': 'Bagikan pendapat Anda tentang produk ini...',
  'No reviews yet. Be the first to review!': 'Belum ada ulasan. Jadilah yang pertama memberi ulasan!',
  'This product is currently out of stock.': 'Produk ini sedang kehabisan stok.',
  'Added!': 'Ditambahkan!',
  'Add to Cart': 'Tambah ke Keranjang',
  'Buy Now': 'Beli Sekarang',
  'Customer Reviews': 'Ulasan Pelanggan',
};

const reverseTranslations = Object.fromEntries(
  Object.entries(translations).map(([english, indonesian]) => [indonesian, english])
);

const indonesianAliases: Record<string, string> = {
  'Riwayat Pemesanan': 'Order History',
  'Masuk ke akun': 'Sign in',
  'Kembali ke toko': 'Back to store',
  'Memeriksa akun...': 'Checking your account...',
  'Konfirmasi dikirim setelah pembayaran berhasil.': 'Confirmation is sent after successful payment.',
  'Saya setuju menerima konfirmasi pembayaran melalui WhatsApp.':
    'I agree to receive payment confirmation via WhatsApp.',
  'Pembayaran berhasil': 'Payment successful',
  'Pembayaran gagal': 'Payment failed',
  Kedaluwarsa: 'Expired',
  'Dana dikembalikan': 'Refunded',
  'Menunggu pembayaran': 'Awaiting payment',
  'Progres:': 'Progress:',
  'Pembayaran belum terkonfirmasi.': 'Payment is not yet confirmed.',
  'Buka halaman Midtrans, pilih QRIS, lalu pindai kode QR untuk membayar.':
    'Open the Midtrans page, select QRIS, then scan the QR code to pay.',
  'Bayar dengan QRIS': 'Pay with QRIS',
  'Durasi standar': 'Standard duration',
  'Menunggu Pembayaran': 'Waiting for payment',
  'Pembayaran Berhasil': 'Payment successful',
  'Pesanan Diterima': 'Order received',
  'Menunggu Data': 'Waiting for information',
  'Sedang Dikerjakan': 'In progress',
  Revisi: 'Revision',
  Selesai: 'Completed',
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  try {
    return window.localStorage.getItem('smartnova-language') === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'id'
      ? 'SmartNova — Marketplace Produk Digital Premium'
      : 'SmartNova — Premium Digital Products Marketplace';
    try {
      window.localStorage.setItem('smartnova-language', language);
    } catch {
      // The language remains available for the current session if storage is disabled.
    }
  }, [language]);

  const t = useCallback(
    (text: string) => language === 'id'
      ? translations[text] ?? text
      : reverseTranslations[text] ?? indonesianAliases[text] ?? text,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
