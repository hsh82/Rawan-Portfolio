import en from '../i18n/en.json';
import fa from '../i18n/fa.json';

export type Locale = 'en' | 'fa';
export const locales: Locale[] = ['en', 'fa'];
export const localeOf = (value: string | undefined): Locale => value === 'fa' ? 'fa' : 'en';
const translations = { en, fa };
export function t(key: string, lang?: string): string {
  const read = (source: object) => key.split('.').reduce<any>((value, part) => value?.[part], source);
  return read(translations[localeOf(lang)]) ?? read(en) ?? key;
}
export const getTranslations = (lang?: string) => translations[localeOf(lang)];
export const localePath = (lang: Locale, path = '') => `/${lang}/${path.replace(/^\/+/, '')}`;

export const categoryLabel = (segment: string, lang: Locale) => { const value = t(`blog.categories.${segment}`, lang); return value.startsWith('blog.categories.') ? segment : value; };
