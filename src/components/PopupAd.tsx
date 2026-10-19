import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSafeExternalUrl } from '@/lib/business';
import { getPopupAdImageUrl, type PopupAdFrequency, type PopupAdSettings } from '@/lib/popupAd';

const sessionStorageKey = 'smartnova-popup-ad-session';
const periodStorageKey = 'smartnova-popup-ad-period';

function hasBeenShown(frequency: PopupAdFrequency) {
  try {
    if (frequency === 'session') return window.sessionStorage.getItem(sessionStorageKey) === 'shown';
    const shownAt = Number(window.localStorage.getItem(periodStorageKey));
    const interval = frequency === 'day' ? 86400000 : frequency === 'week' ? 604800000 : 2592000000;
    return Number.isFinite(shownAt) && Date.now() - shownAt < interval;
  } catch (error) {
    console.error('Unable to read popup ad frequency:', error);
    return false;
  }
}

function recordShown(frequency: PopupAdFrequency) {
  try {
    if (frequency === 'session') window.sessionStorage.setItem(sessionStorageKey, 'shown');
    else window.localStorage.setItem(periodStorageKey, String(Date.now()));
  } catch (error) {
    console.error('Unable to save popup ad frequency:', error);
  }
}

type PopupAdDialogProps = {
  imageUrl: string;
  title: string;
  targetUrl: string | null;
  onClose: () => void;
  onImageError?: () => void;
};

export function PopupAdDialog({ imageUrl, title, targetUrl, onClose, onImageError }: PopupAdDialogProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const safeTargetUrl = getSafeExternalUrl(targetUrl);
  const image = (
    <img
      src={imageUrl}
      alt={title}
      className="block max-h-[85vh] max-w-[min(92vw,900px)] rounded-xl object-contain shadow-2xl"
      onError={onImageError}
    />
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="presentation">
      <div
        className="relative flex max-h-[92vh] max-w-[96vw] items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {safeTargetUrl ? (
          <a href={safeTargetUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buka promosi: ${title}`}>
            {image}
          </a>
        ) : image}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup iklan"
          className="absolute -right-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg hover:bg-slate-700 sm:-right-4 sm:-top-4"
        >
          <X size={25} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export function PopupAd({ suppressed = false }: { suppressed?: boolean }) {
  const [settings, setSettings] = useState<PopupAdSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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
          console.error('Unable to load popup ad settings:', error.message);
        } else if (
          data
          && typeof data.title === 'string'
          && typeof data.enabled === 'boolean'
          && (data.image_path === null || typeof data.image_path === 'string')
          && typeof data.delay_seconds === 'number'
          && ['session', 'day', 'week', 'month'].includes(data.frequency)
          && (data.target_url === null || typeof data.target_url === 'string')
        ) {
          setSettings(data as PopupAdSettings);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const imageUrl = getPopupAdImageUrl(settings?.image_path ?? null);
    if (
      loading
      || suppressed
      || dismissed
      || !settings?.enabled
      || !imageUrl
      || imageFailed
      || hasBeenShown(settings.frequency)
    ) return;

    const timer = window.setTimeout(() => setVisible(true), settings.delay_seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [dismissed, imageFailed, loading, settings, suppressed]);

  const close = () => {
    if (settings) recordShown(settings.frequency);
    setVisible(false);
    setDismissed(true);
  };

  const imageUrl = getPopupAdImageUrl(settings?.image_path ?? null);
  if (!visible || suppressed || !settings || !imageUrl || imageFailed) return null;

  return (
    <PopupAdDialog
      imageUrl={imageUrl}
      title={settings.title || 'Iklan'}
      targetUrl={settings.target_url}
      onClose={close}
      onImageError={() => {
        console.error('Popup ad image failed to load.');
        setImageFailed(true);
      }}
    />
  );
}
