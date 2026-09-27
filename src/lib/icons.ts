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
