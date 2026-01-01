import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKeys, SupportedLanguage, supportedLanguages } from './translations';

const LANGUAGE_STORAGE_KEY = '@bms_buddy_language';

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: TranslationKeys;
  supportedLanguages: typeof supportedLanguages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Get device language
const getDeviceLanguage = (): SupportedLanguage => {
  let deviceLanguage = 'en';
  
  if (Platform.OS === 'ios') {
    deviceLanguage = NativeModules.SettingsManager?.settings?.AppleLocale ||
                     NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                     'en';
  } else {
    deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'en';
  }
  
  // Extract language code (e.g., 'en_US' -> 'en', 'es-ES' -> 'es')
  const languageCode = deviceLanguage.split(/[-_]/)[0].toLowerCase();
  
  // Check if supported, default to English
  if (languageCode in translations) {
    return languageCode as SupportedLanguage;
  }
  
  return 'en';
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language or use device language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && savedLanguage in translations) {
          setLanguageState(savedLanguage as SupportedLanguage);
        } else {
          const deviceLang = getDeviceLanguage();
          setLanguageState(deviceLang);
        }
      } catch (error) {
        console.error('Error loading language:', error);
        setLanguageState(getDeviceLanguage());
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, []);

  const t = translations[language];

  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, supportedLanguages }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export { supportedLanguages, SupportedLanguage } from './translations';
