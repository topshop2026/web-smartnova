import { supabase } from '@/lib/supabase';

export type PopupAdFrequency = 'session' | 'day' | 'week' | 'month';

export type PopupAdSettings = {
  id: number;
  title: string;
  enabled: boolean;
  image_path: string | null;
  delay_seconds: number;
  frequency: PopupAdFrequency;
  target_url: string | null;
};

export const popupAdBucket = 'popup-ad-images';

export function getPopupAdImageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from(popupAdBucket).getPublicUrl(path).data.publicUrl;
}
