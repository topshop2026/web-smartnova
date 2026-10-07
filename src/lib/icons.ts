import {
  LayoutTemplate,
  Component,
  BookOpen,
  Palette,
  Code2,
  GraduationCap,
  Music,
  Box,
  Package,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  LayoutTemplate,
  Component,
  BookOpen,
  Palette,
  Code2,
  GraduationCap,
  Music,
  Box,
  Package,
};

export function getCategoryIcon(name: string): LucideIcon {
  return iconMap[name] || Package;
}

export function isCategoryIconUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getCategoryIconImageUrl(value: string): string {
  const rawUrl = value.trim();
  if (!isCategoryIconUrl(rawUrl)) return rawUrl;

  const url = new URL(rawUrl);
  if (url.hostname !== 'drive.google.com') return rawUrl;

  const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
    ?? url.searchParams.get('id');
  if (!fileId) return rawUrl;

  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w256`;
}
