import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage, LanguageOption, SUPPORTED_LANGUAGES } from './types';
import { en } from './en';
import { pt } from './pt';
import { sw } from './sw';
import { fr } from './fr';

const STORAGE_KEY = '@aura_app_language';

const dictionaries: Record<SupportedLanguage, Record<string, string>> = {
  en,
  pt,
  sw,
  fr,
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (phrase: string) => string;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: async () => {},
  t: (phrase: string) => phrase,
  currentLanguageOption: SUPPORTED_LANGUAGES[1],
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<SupportedLanguage>('pt');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && (saved === 'en' || saved === 'pt' || saved === 'sw' || saved === 'fr')) {
        setLangState(saved as SupportedLanguage);
      }
    }).catch(() => {});
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLangState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to persist language preference', e);
    }
  }, []);

  const t = useCallback((phrase: string): string => {
    if (!phrase) return '';
    const localized = dictionaries[language]?.[phrase];
    if (localized !== undefined) {
      return localized;
    }
    // Fallback to English, then original phrase
    const fallbackEn = dictionaries.en?.[phrase];
    return fallbackEn !== undefined ? fallbackEn : phrase;
  }, [language]);

  const currentLanguageOption = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[1];
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    currentLanguageOption,
    supportedLanguages: SUPPORTED_LANGUAGES,
  }), [language, setLanguage, t, currentLanguageOption]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
