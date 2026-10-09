export type ServicePackage = {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  includes: string[];
};

export const servicePackages: ServicePackage[] = [
  {
    name: 'Website Starter',
    price: 'Rp2.500.000',
    description: 'Website profil bisnis atau landing page responsif.',
    includes: ['Desain responsif', 'Kontak bisnis', 'SEO dasar'],
  },
  {
    name: 'Online Business',
    price: 'Rp4.500.000',
    description: 'Katalog atau toko online untuk mulai menjual.',
    includes: ['Katalog produk', 'Alur pemesanan', 'Integrasi sesuai kebutuhan'],
  },
  {
    name: 'Custom Application',
    price: 'Rp6.000.000',
    description: 'Aplikasi yang dirancang mengikuti alur kerja bisnis.',
    includes: ['Analisis kebutuhan', 'Rancangan solusi', 'Pengembangan dan pengujian'],
  },
  {
    name: 'Maintenance',
    price: 'Rp300.000',
    cadence: '/bulan',
    description: 'Dukungan dan pemeliharaan dengan cakupan yang disepakati.',
    includes: ['Pemeriksaan berkala', 'Dukungan teknis', 'Ruang lingkup ditetapkan di awal'],
  },
];

export const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
export const businessEmail = import.meta.env.VITE_BUSINESS_EMAIL ?? '';

export function getWhatsAppUrl(message: string) {
  if (whatsappNumber.length < 8 || whatsappNumber.length > 15) return null;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function getSafeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

type AnalyticsEvent =
  | 'view_product'
  | 'click_buy'
  | 'click_whatsapp'
  | 'submit_lead'
  | 'click_service_cta';

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: AnalyticsEvent, parameters?: Record<string, string>) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, parameters?: Record<string, string>) {
  window.gtag?.('event', event, parameters);
}
