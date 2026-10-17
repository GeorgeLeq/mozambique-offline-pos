export type SupportedLanguage = 'en' | 'pt' | 'sw' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português (MZ)', flag: '🇲🇿' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export type TranslationDictionary = Record<string, string>;
