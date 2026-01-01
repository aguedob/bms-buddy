import en from './en';
import es from './es';
import fr from './fr';

export const translations = {
  en,
  es,
  fr,
};

export type TranslationKeys = typeof en;
export type SupportedLanguage = keyof typeof translations;

export const supportedLanguages: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];
