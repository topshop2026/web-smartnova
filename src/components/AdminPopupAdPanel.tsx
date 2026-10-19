import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSafeExternalUrl } from '@/lib/business';
import {
  getPopupAdImageUrl,
  popupAdBucket,
  type PopupAdFrequency,
  type PopupAdSettings,
} from '@/lib/popupAd';
import { PopupAdDialog } from '@/components/PopupAd';

const defaultSettings: PopupAdSettings = {
  id: 1,
  title: '',
  enabled: false,
  image_path: null,
  delay_seconds: 3,
  frequency: 'session',
  target_url: null,
};

async function isPng(file: File) {
  if (file.size > 10 * 1024 * 1024) return false;
  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return signature.length === 8
    && signature[0] === 0x89
    && signature[1] === 0x50
    && signature[2] === 0x4e
    && signature[3] === 0x47
    && signature[4] === 0x0d
    && signature[5] === 0x0a
    && signature[6] === 0x1a
    && signature[7] === 0x0a;
}

export function AdminPopupAdPanel() {
  const [settings, setSettings] = useState<PopupAdSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fileError, setFileError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase
      .from('popup_ad_settings')
      .select('id,title,enabled,image_path,delay_seconds,frequency,target_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setLoadError(error.message);
        } else if (data) {
          setSettings(data as PopupAdSettings);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const imageUrl = localPreviewUrl ?? (removeImage ? null : getPopupAdImageUrl(settings.image_path));
  const safeTargetUrl = getSafeExternalUrl(settings.target_url);

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setFileError('');
    if (!(await isPng(file))) {
      setSelectedFile(null);
      setFileError('Pilih file PNG yang valid dengan ukuran maksimal 10 MB.');
      return;
    }
    setSelectedFile(file);
    setRemoveImage(false);
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loadError) return;

    const title = settings.title.trim();
    const targetUrl = settings.target_url?.trim() ?? '';
    if (!title) {
      setMessage({ text: 'Nama internal iklan wajib diisi.', error: true });
      return;
    }
    if (settings.enabled && !selectedFile && (removeImage || !settings.image_path)) {
      setMessage({ text: 'Tambahkan gambar PNG sebelum mengaktifkan iklan.', error: true });
      return;
    }
    if (targetUrl && !getSafeExternalUrl(targetUrl)) {
      setMessage({ text: 'URL tujuan harus menggunakan alamat HTTP atau HTTPS yang valid.', error: true });
      return;
    }

    setSaving(true);
    setMessage(null);
    const previousImagePath = settings.image_path;
    let nextImagePath = removeImage ? null : previousImagePath;
    let uploadedPath: string | null = null;

    if (selectedFile) {
      uploadedPath = `${crypto.randomUUID()}.png`;
      const { error } = await supabase.storage
        .from(popupAdBucket)
        .upload(uploadedPath, selectedFile, { contentType: 'image/png', upsert: false });
      if (error) {
        setMessage({ text: `Gambar gagal diunggah: ${error.message}`, error: true });
        setSaving(false);
        return;
      }
      nextImagePath = uploadedPath;
    }

    const nextSettings: PopupAdSettings = {
      ...settings,
      title,
      image_path: nextImagePath,
      target_url: targetUrl ? getSafeExternalUrl(targetUrl) : null,
    };
    const { error: saveError } = await supabase
      .from('popup_ad_settings')
      .upsert(nextSettings, { onConflict: 'id' });

    if (saveError) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from(popupAdBucket).remove([uploadedPath]);
        if (cleanupError) console.error('Unable to remove an unreferenced popup ad image:', cleanupError.message);
      }
      setMessage({ text: `Pengaturan gagal disimpan: ${saveError.message}`, error: true });
      setSaving(false);
      return;
    }

    setSettings(nextSettings);
    setSelectedFile(null);
    setRemoveImage(false);
    let successMessage = 'Pengaturan popup iklan berhasil disimpan.';
    if (previousImagePath && previousImagePath !== nextImagePath) {
      const { error: removeError } = await supabase.storage.from(popupAdBucket).remove([previousImagePath]);
      if (removeError) {
        console.error('Unable to remove the replaced popup ad image:', removeError.message);
        successMessage += ` Gambar lama gagal dihapus: ${removeError.message}`;
      }
    }
    setMessage({ text: successMessage, error: false });
    setSaving(false);
  };

  if (loading) {
    return <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500" role="status">Memuat pengaturan popup iklan...</p>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">Pengaturan Popup Iklan</h2>
        <p className="mt-1 text-sm text-slate-500">Unggah gambar PNG dan atur kapan iklan ditampilkan kepada pengunjung.</p>
      </div>
      {loadError && (
        <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Pengaturan gagal dimuat: {loadError}. Periksa migrasi Supabase dan coba muat ulang halaman.
        </p>
      )}
      {message && (
        <p role={message.error ? 'alert' : 'status'} className={`mb-4 rounded-lg border p-3 text-sm ${message.error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {message.text}
        </p>
      )}
      <form onSubmit={(event) => void saveSettings(event)} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nama internal iklan
          <input
            required
            maxLength={120}
            value={settings.title}
            onChange={(event) => setSettings({ ...settings, title: event.target.value })}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
            className="h-4 w-4 accent-blue-700"
          />
          Aktifkan popup untuk pengunjung
        </label>
        <div className="sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Gambar iklan (PNG, maks. 10 MB)</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ImagePlus size={17} /> Pilih gambar PNG
              <input type="file" accept="image/png,.png" onChange={(event) => void chooseImage(event)} className="sr-only" />
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setRemoveImage(true);
                  setFileError('');
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                <Trash2 size={16} /> Hapus gambar
              </button>
            )}
            {selectedFile && <span className="text-xs text-slate-500">{selectedFile.name}</span>}
          </div>
          {fileError && <p role="alert" className="mt-2 text-sm text-rose-700">{fileError}</p>}
          {imageUrl ? (
            <img src={imageUrl} alt="Preview gambar iklan" className="mt-3 max-h-64 max-w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Belum ada gambar iklan.</p>
          )}
        </div>
        <label className="text-sm font-medium text-slate-700">
          Waktu tunda kemunculan
          <select
            value={settings.delay_seconds}
            onChange={(event) => setSettings({ ...settings, delay_seconds: Number(event.target.value) })}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            {[3, 5, 10, 15, 30].map((seconds) => <option key={seconds} value={seconds}>{seconds} detik</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Frekuensi kemunculan
          <select
            value={settings.frequency}
            onChange={(event) => setSettings({ ...settings, frequency: event.target.value as PopupAdFrequency })}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="session">Sekali per sesi browser</option>
            <option value="day">Sekali per hari</option>
            <option value="week">Sekali per minggu</option>
            <option value="month">Sekali per bulan (30 hari)</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          URL tujuan saat gambar diklik (opsional)
          <input
            type="url"
            value={settings.target_url ?? ''}
            onChange={(event) => setSettings({ ...settings, target_url: event.target.value || null })}
            placeholder="https://contoh.com/promo"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm"
          />
          {settings.target_url && !safeTargetUrl && <span className="mt-1 block text-xs text-rose-700">Gunakan URL HTTP atau HTTPS yang valid.</span>}
        </label>
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <button
            type="button"
            disabled={!imageUrl}
            onClick={() => setPreviewOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Preview popup
          </button>
          <button
            type="submit"
            disabled={saving || Boolean(loadError)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan pengaturan'}
          </button>
        </div>
      </form>
      {previewOpen && imageUrl && (
        <div className="fixed inset-0 z-[100]">
          <PopupAdDialog
            imageUrl={imageUrl}
            title={settings.title || 'Preview iklan'}
            targetUrl={safeTargetUrl}
            onClose={() => setPreviewOpen(false)}
            onImageError={() => {
              setPreviewOpen(false);
              setMessage({ text: 'Gambar preview gagal dimuat. Periksa kembali file PNG.', error: true });
            }}
          />
        </div>
      )}
    </section>
  );
}
