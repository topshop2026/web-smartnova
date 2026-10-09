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

  if (page === 'privacy' || page === 'terms' || page === 'refund') {
    const content = {
      privacy: {
        title: 'Kebijakan privasi',
        text: 'Informasi pada formulir konsultasi digunakan untuk meninjau dan menindaklanjuti permintaan Anda. Jangan mengirimkan kata sandi, data pembayaran, atau informasi sensitif. Untuk permintaan terkait data, hubungi SmartNova melalui kanal kontak resmi yang telah dikonfigurasi.',
      },
      terms: {
        title: 'Syarat layanan',
        text: 'Informasi paket dan harga pada website merupakan indikasi awal. Proposal tertulis akan menjelaskan ruang lingkup, deliverable, jadwal, biaya, lisensi, revisi, dan dukungan sebelum pekerjaan dimulai. Ketentuan final mengikuti kesepakatan tertulis antara SmartNova dan pelanggan.',
      },
      refund: {
        title: 'Kebijakan pembatalan dan pengembalian dana',
        text: 'Ketentuan pembatalan, perubahan ruang lingkup, dan pengembalian dana akan dicantumkan pada proposal atau ketentuan pembelian yang berlaku untuk produk atau layanan terkait. Hubungi SmartNova sebelum melakukan pemesanan untuk memperoleh ketentuan yang sesuai.',
      },
    }[page];
    return <div className="business-page"><section className="section section-light legal-page"><div className="site-container"><button className="text-link" onClick={() => onNavigate('home')}><ArrowLeft size={16} /> Kembali ke beranda</button><span className="section-kicker">INFORMASI SMARTNOVA</span><h1>{content.title}</h1><p>{content.text}</p><p className="legal-notice">Halaman ini perlu ditinjau dan dilengkapi oleh pemilik SmartNova sebelum digunakan sebagai ketentuan final.</p><button className="button button-primary" onClick={() => onNavigate('contact')}>Tanyakan kepada kami <ArrowRight size={16} /></button></div></section></div>;
  }

  return <div className="business-page"><section className="section section-light not-found"><div className="site-container"><span className="section-kicker">404</span><h1>Halaman tidak ditemukan.</h1><p>Alamat yang Anda buka tidak tersedia.</p><button className="button button-primary" onClick={() => onNavigate('home')}>Kembali ke beranda <ArrowRight size={16} /></button></div></section></div>;
}
