import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  ChevronDown,
  Code2,
  Headphones,
  MessageCircle,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { supabase, type Category, type PortfolioProject, type Product } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { servicePackages, getWhatsAppUrl, trackEvent } from '@/lib/business';
import { portfolioExamples } from '@/lib/portfolioExamples';
import { PortfolioCard } from '@/components/PortfolioCard';

type HomePageProps = {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onAddToCart: (product: Product) => void;
  onChat: (product: Product) => void;
  onProductClick: (product: Product) => void;
};

const strengths = [
  { icon: ShieldCheck, title: 'Solusi terpercaya', detail: 'Informasi dan ruang lingkup yang jelas' },
  { icon: BadgeCheck, title: 'Harga transparan', detail: 'Biaya dibahas sebelum pekerjaan dimulai' },
  { icon: Headphones, title: 'Dukungan profesional', detail: 'Komunikasi langsung dengan tim SmartNova' },
];

const capabilities = [
  { icon: Smartphone, title: 'Aplikasi mobile', detail: 'Solusi Android dan iOS sesuai kebutuhan.' },
  { icon: Monitor, title: 'Aplikasi web', detail: 'Sistem web yang mudah diakses dan digunakan.' },
  { icon: Workflow, title: 'Website profesional', detail: 'Website untuk bisnis dan personal brand.' },
  { icon: Boxes, title: 'Produk digital', detail: 'Solusi digital siap pakai dengan informasi yang jelas.' },
  { icon: Code2, title: 'Konsultasi custom', detail: 'Ruang lingkup disusun mengikuti proses bisnis Anda.' },
];

const faqs = [
  {
    question: 'Bagaimana cara memulai proyek?',
    answer: 'Ceritakan kebutuhan Anda melalui formulir konsultasi. Kami akan meninjau ruang lingkup dan membahas estimasi sebelum proposal disepakati.',
  },
  {
    question: 'Apakah harga paket sudah termasuk domain dan hosting?',
    answer: 'Belum tentu. Domain, hosting, lisensi, biaya layanan pihak ketiga, serta kebutuhan tambahan dibahas dan dicantumkan terpisah dalam proposal.',
  },
  {
    question: 'Apakah saya bisa meminta solusi di luar paket?',
    answer: 'Bisa. Pilih konsultasi proyek custom agar kebutuhan, prioritas, dan estimasinya dapat dibahas lebih dulu.',
  },
];

const illustrativeTestimonials = [
  {
    quote: 'Aplikasi kasirnya sangat membantu usaha kami. Fiturnya lengkap dan mudah digunakan.',
    name: 'Budi Santoso',
    role: 'Pemilik Toko Sinar Abadi',
    initials: 'BS',
  },
  {
    quote: 'Website yang dibuat terlihat profesional dan sesuai dengan kebutuhan bisnis kami.',
    name: 'Rina Mulyani',
    role: 'Pemilik Toko Online',
    initials: 'RM',
  },
  {
    quote: 'Pengerjaan aplikasi berjalan lancar dan fiturnya disesuaikan dengan kebutuhan.',
    name: 'Andi Pratama',
    role: 'Pemilik UMKM Digital',
    initials: 'AP',
  },
];

export function HomePage({ onNavigate, onAddToCart, onChat, onProductClick }: HomePageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    let active = true;
    const loadHome = async () => {
      const [categoryResult, productResult, projectResult] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('products').select('*').eq('is_featured', true).order('sales_count', { ascending: false }).limit(4),
        supabase.from('portfolio_projects').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3),
      ]);
      if (!active) return;
      const errors = [categoryResult.error, productResult.error, projectResult.error].filter(Boolean);
      if (errors.length) setContentError('Sebagian konten belum dapat dimuat. Silakan muat ulang halaman.');
      setCategories(categoryResult.data ?? []);
      setFeatured((productResult.data as Product[] | null) ?? []);
      const publishedProjects = (projectResult.data as PortfolioProject[] | null) ?? [];
      const clientProjects = publishedProjects.filter((project) => !project.is_concept);
      const conceptProjects = publishedProjects.filter((project) => project.is_concept);
      setPortfolio(clientProjects.length ? clientProjects : conceptProjects);
      if (active) setLoading(false);
    };
    void loadHome();
    return () => { active = false; };
  }, []);

  const whatsappUrl = getWhatsAppUrl('Halo SmartNova, saya ingin berkonsultasi tentang proyek digital.');

  return (
    <div className="business-home">
      <section className="hero-section">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="site-container hero-layout">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={14} /> Solusi digital untuk bisnis yang berkembang</span>
            <h1>Build Smarter.<br /><span>Grow Faster.</span></h1>
            <p>
              SmartNova menghadirkan produk digital dan layanan software engineering untuk membantu
              individu dan UMKM bekerja lebih efisien. Mulai dari aplikasi siap pakai hingga sistem
              khusus yang dirancang untuk kebutuhan Anda.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => onNavigate('catalog')}>
                Jelajahi produk <ArrowRight size={17} />
              </button>
              <button className="button button-outline" onClick={() => onNavigate('contact')}>
                Konsultasi proyek
              </button>
            </div>
            <div className="hero-trust">
              {strengths.map(({ icon: Icon, title }) => (
                <span key={title}><Icon size={16} />{title}</span>
              ))}
            </div>
          </div>

          <div className="hero-art" aria-label="Pratinjau solusi digital SmartNova">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-dashboard">
              <div className="dashboard-top"><span /><span /><span /><b>SMARTNOVA / DASHBOARD</b></div>
              <div className="dashboard-content">
                <div className="dashboard-sidebar"><i /><i /><i /><i /></div>
                <div className="dashboard-main">
                  <div className="dashboard-title"><span /><i /></div>
                  <div className="dashboard-stats"><i /><i /><i /></div>
                  <div className="dashboard-chart"><span /><span /><span /><span /><span /><span /><span /></div>
                  <div className="dashboard-lines"><i /><i /><i /></div>
                </div>
              </div>
            </div>
            <div className="art-phone"><div /><b /><i /><i /><i /></div>
            <div className="art-float-card"><span /><i /><i /><i /></div>
            <div className="art-caption"><span className="live-dot" /> Produk & software yang bekerja untuk bisnis Anda</div>
          </div>
        </div>
      </section>

      <section className="capability-strip">
        <div className="site-container capability-grid">
          {capabilities.map(({ icon: Icon, title, detail }) => (
            <article className="capability-card" key={title}>
              <span className="capability-icon"><Icon size={21} /></span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-light" id="produk">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">SOLUSI SIAP PAKAI</span>
              <h2>Produk digital unggulan</h2>
              <p>Temukan aplikasi dan aset digital yang membantu pekerjaan Anda menjadi lebih efisien.</p>
            </div>
            <button className="text-link" onClick={() => onNavigate('catalog')}>
              Lihat semua produk <ArrowRight size={16} />
            </button>
          </div>
          {categories.length > 0 && (
            <div className="category-pills" aria-label="Kategori produk">
              {categories.slice(0, 5).map((category) => (
                <button key={category.id} onClick={() => onNavigate('catalog', { category: category.slug })}>
                  {category.name}<ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          )}
          {contentError && <p className="content-notice" role="status">{contentError}</p>}
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="product-skeleton" />)}
            </div>
          ) : featured.length ? (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onChat={onChat}
                  onClick={onProductClick}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Boxes size={24} />
              <p>Produk unggulan akan segera tersedia.</p>
              <button className="text-link" onClick={() => onNavigate('catalog')}>Lihat katalog <ArrowRight size={16} /></button>
            </div>
          )}
        </div>
      </section>

      <section className="services-showcase" id="jasa">
        <div className="site-container services-layout">
          <div className="services-intro">
            <span className="section-kicker">DARI IDE MENJADI SOLUSI</span>
            <h2>Layanan yang dirancang untuk kebutuhan nyata.</h2>
            <p>Kami membantu merancang dan mengembangkan solusi digital dengan ruang lingkup yang dibahas secara transparan.</p>
            <button className="button button-outline" onClick={() => onNavigate('services')}>
              Lihat semua layanan <ArrowRight size={16} />
            </button>
          </div>
          <div className="services-metrics">
            <div className="service-metric"><span><Code2 size={18} /></span><b>Analisis</b><small>Memahami alur kerja dan kebutuhan Anda</small></div>
            <div className="service-metric"><span><Monitor size={18} /></span><b>Pengembangan</b><small>Membangun solusi sesuai ruang lingkup</small></div>
            <div className="service-metric"><span><BadgeCheck size={18} /></span><b>Serah terima</b><small>Hasil dan dukungan dijelaskan di awal</small></div>
          </div>
        </div>
      </section>

      <section className="section section-light" id="paket">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">PAKET JASA</span>
              <h2>Mulai dari kebutuhan Anda</h2>
              <p>Harga indikatif. Biaya akhir dan cakupan disepakati setelah kebutuhan ditinjau.</p>
            </div>
            <button className="text-link" onClick={() => onNavigate('services')}>
              Detail paket jasa <ArrowRight size={16} />
            </button>
          </div>
          <div className="service-package-grid">
            {servicePackages.map((service, index) => (
              <article className="service-package-card" key={service.name}>
                <span className="package-icon">{index === 0 ? <Monitor size={19} /> : index === 1 ? <Boxes size={19} /> : index === 2 ? <Code2 size={19} /> : <Headphones size={19} />}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="package-price"><small>Mulai dari</small><strong>{service.price}</strong>{service.cadence && <small>{service.cadence}</small>}</div>
                <ul>{service.includes.map((item) => <li key={item}><BadgeCheck size={14} />{item}</li>)}</ul>
                <button
                  className="button button-primary package-cta"
                  onClick={() => {
                    trackEvent('click_service_cta', { service: service.name });
                    onNavigate('contact', { service: service.name });
                  }}
                >
                  Konsultasi paket <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
          <p className="pricing-disclaimer">Harga akhir bergantung pada kompleksitas, revisi, integrasi, domain/hosting, lisensi, pajak, serta dukungan yang disepakati.</p>
        </div>
      </section>

      <section className="section portfolio-section">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">PORTOFOLIO</span>
              <h2>Karya dan solusi</h2>
              <p>Pelajari pendekatan dan hasil dari proyek yang telah dipublikasikan.</p>
            </div>
            <button className="text-link" onClick={() => onNavigate('portfolio')}>
              Lihat portofolio <ArrowRight size={16} />
            </button>
          </div>
          {portfolio.length > 0 && portfolio.every((project) => project.is_concept) && (
            <p className="concept-notice"><Workflow size={16} /> Contoh demo/konsep — bukan proyek klien atau portofolio pekerjaan yang telah diselesaikan.</p>
          )}
          {portfolio.length ? (
            <div className="portfolio-grid">
              {portfolio.map((project, index) => <PortfolioCard key={project.id} project={project} index={index} />)}
            </div>
          ) : (
            <>
              <p className="concept-notice"><Workflow size={16} /> Contoh demo/konsep — bukan proyek klien atau portofolio pekerjaan yang telah diselesaikan.</p>
              <div className="portfolio-grid">
                {portfolioExamples.slice(0, 3).map((project, index) => <PortfolioCard key={project.id} project={project} index={index} />)}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section testimonial-section">
        <div className="site-container">
          <div className="testimonial-heading">
            <div>
              <span className="section-kicker">CONTOH ILUSTRATIF · BUKAN TESTIMONI PELANGGAN</span>
              <h2>Contoh tampilan testimoni</h2>
              <p>Nama dan kutipan di bawah ini hanya contoh desain, bukan pernyataan dari klien nyata.</p>
            </div>
            <button className="text-link" onClick={() => onNavigate('catalog')}>
              Lihat produk digital <ArrowRight size={16} />
            </button>
          </div>
          <div className="testimonial-grid">
            {illustrativeTestimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.initials}>
                <span className="testimonial-quote-mark" aria-hidden="true">“</span>
                <blockquote>{testimonial.quote}</blockquote>
                <div className="testimonial-author">
                  <span className="testimonial-avatar" aria-hidden="true">{testimonial.initials}</span>
                  <span><strong>{testimonial.name}</strong><small>{testimonial.role}</small></span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light faq-section" id="faq">
        <div className="site-container faq-layout">
          <div><span className="section-kicker">FAQ</span><h2>Pertanyaan yang sering diajukan</h2><p>Belum menemukan jawaban? Sampaikan kebutuhan Anda kepada kami.</p><button className="text-link" onClick={() => onNavigate('contact')}>Hubungi SmartNova <ArrowRight size={16} /></button></div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<ChevronDown size={17} /></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="site-container closing-cta-inner">
          <div><span className="section-kicker">PUNYA RENCANA DIGITAL?</span><h2>Mari mulai dari percakapan.</h2><p>Ceritakan kebutuhan Anda. Kami bantu membahas langkah dan cakupan yang sesuai.</p></div>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => onNavigate('contact')}>Konsultasi proyek <ArrowRight size={16} /></button>
            {whatsappUrl ? (
              <a className="button button-outline" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('click_whatsapp', { source: 'home_cta' })}>
                <MessageCircle size={16} /> WhatsApp
              </a>
            ) : (
              <button className="button button-outline" onClick={() => onNavigate('contact')}>Kirim pesan</button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
