import { useState, type FormEvent } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/business';

type LeadFormProps = {
  initialService?: string;
};

const projectTypes = [
  ['website', 'Website bisnis'],
  ['online_store', 'Toko online'],
  ['mobile_app', 'Aplikasi mobile'],
  ['custom_system', 'Sistem bisnis khusus'],
  ['digital_product', 'Produk digital'],
  ['other', 'Lainnya'],
];

export function LeadForm({ initialService = '' }: LeadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const contact = String(data.get('contact') ?? '').trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const normalizedPhone = contact.replace(/[\s().-]/g, '');
    const isPhone = /^\+?[0-9]{8,15}$/.test(normalizedPhone);
    if (!isEmail && !isPhone) {
      setError('Masukkan alamat email atau nomor WhatsApp yang valid.');
      return;
    }
    if (website) {
      setError('Permintaan tidak dapat diproses. Silakan coba kembali.');
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await supabase.from('leads').insert({
      name: String(data.get('name') ?? '').trim(),
      contact,
      project_type: String(data.get('project_type') ?? ''),
      service_package: initialService || null,
      budget: String(data.get('budget') ?? '').trim() || null,
      target_timeline: String(data.get('target_timeline') ?? '').trim() || null,
      summary: String(data.get('summary') ?? '').trim(),
      privacy_consent: data.get('privacy_consent') === 'on',
    });
    setSubmitting(false);
    if (submitError) {
      console.error('Lead submission failed:', submitError.message);
      setError('Permintaan belum berhasil dikirim. Silakan coba lagi beberapa saat.');
      return;
    }

    trackEvent('submit_lead', { project_type: String(data.get('project_type') ?? '') });
    setSubmitted(true);
    form.reset();
  };

  if (submitted) {
    return (
      <div role="status" className="lead-success">
        <CheckCircle2 size={28} />
        <div>
          <h3>Terima kasih, permintaan Anda sudah kami terima.</h3>
          <p>Tim SmartNova akan meninjau kebutuhan yang Anda kirimkan.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="lead-form-row">
        <label>
          Nama
          <input name="name" autoComplete="name" minLength={2} maxLength={120} required />
        </label>
        <label>
          Email atau nomor WhatsApp
          <input name="contact" maxLength={254} required />
        </label>
      </div>
      {initialService && <p className="selected-service">Paket yang diminati: <strong>{initialService}</strong></p>}
      <div className="lead-form-row">
        <label>
          Jenis kebutuhan
          <select
            name="project_type"
            defaultValue={projectTypes.some(([value]) => value === initialService) ? initialService : initialService ? 'other' : 'website'}
            required
          >
            {projectTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Anggaran (opsional)
          <input name="budget" maxLength={100} placeholder="Contoh: Rp5–10 juta" />
        </label>
      </div>
      <label>
        Target waktu (opsional)
        <input name="target_timeline" maxLength={100} placeholder="Contoh: bulan depan" />
      </label>
      <label>
        Ceritakan kebutuhan Anda
        <textarea name="summary" minLength={10} maxLength={3000} rows={5} required />
      </label>
      <label className="lead-consent">
        <input name="privacy_consent" type="checkbox" required />
        <span>Saya setuju data ini digunakan untuk menindaklanjuti permintaan konsultasi sesuai <a href="/privacy">kebijakan privasi</a>.</span>
      </label>
      <div className="lead-honeypot" aria-hidden="true">
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      {error && <p className="lead-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={submitting} type="submit">
        <Send size={16} />
        {submitting ? 'Mengirim...' : 'Kirim permintaan'}
      </button>
    </form>
  );
}
