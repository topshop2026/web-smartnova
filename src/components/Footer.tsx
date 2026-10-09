import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type FooterProps = {
  onNavigate: (page: string, params?: Record<string, string>) => void;
};

const footerGroups = [
  {
    title: 'Jelajahi',
    links: [
      ['Produk digital', 'catalog'],
      ['Layanan jasa', 'services'],
      ['Portofolio', 'portfolio'],
      ['Tentang kami', 'about'],
      ['Kontak', 'contact'],
    ],
  },
  {
    title: 'Informasi',
    links: [
      ['Kebijakan privasi', 'privacy'],
      ['Syarat layanan', 'terms'],
      ['Pembatalan & refund', 'refund'],
    ],
  },
];

export function Footer({ onNavigate }: FooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="site-container footer-main">
        <div className="footer-brand">
          <button className="brand-lockup" onClick={() => onNavigate('home')}>
            <span className="brand-symbol"><Sparkles size={20} /></span>
            <span>Smart<span>Nova</span></span>
          </button>
          <p>Build Smarter. Grow Faster.</p>
          <small>Produk digital dan layanan software engineering untuk bisnis yang ingin berkembang.</small>
        </div>
        {footerGroups.map((group) => (
          <div className="footer-links" key={group.title}>
            <h2>{t(group.title)}</h2>
            {group.links.map(([label, page]) => (
              <button key={page} onClick={() => onNavigate(page)}>{t(label)}<ArrowUpRight size={13} /></button>
            ))}
          </div>
        ))}
        <div className="footer-contact">
          <h2>{t('Contact')}</h2>
          <p>Diskusikan kebutuhan produk atau proyek digital Anda.</p>
          <button className="footer-contact-link" onClick={() => onNavigate('contact')}>Mulai konsultasi <ArrowUpRight size={14} /></button>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>&copy; {new Date().getFullYear()} SmartNova. {t('All rights reserved.')}</span>
        <span>Build Smarter. Grow Faster.</span>
      </div>
    </footer>
  );
}
