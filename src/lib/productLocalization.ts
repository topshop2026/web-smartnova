import type { Language } from '@/context/LanguageContext';

type LocalizedProductFields = {
  name: string;
  name_en?: string | null;
  description: string;
  description_en?: string | null;
};

export function getLocalizedProduct(
  product: LocalizedProductFields,
  language: Language
) {
  return {
    name: language === 'en' ? product.name_en?.trim() || product.name : product.name,
    description: language === 'en'
      ? product.description_en?.trim() || product.description
      : product.description,
  };
}
