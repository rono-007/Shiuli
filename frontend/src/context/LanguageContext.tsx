import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLanguageChosen: boolean;
  t: typeof translations['bn'];
  showLanguageModal: boolean;
  setShowLanguageModal: (show: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem('shiuli_lang') as Language | null;
      return (savedLang === 'bn' || savedLang === 'en') ? savedLang : 'bn';
    } catch {
      return 'bn';
    }
  });

  const [isLanguageChosen, setIsLanguageChosen] = useState<boolean>(() => {
    try {
      const savedLang = localStorage.getItem('shiuli_lang');
      return !!(savedLang === 'bn' || savedLang === 'en');
    } catch {
      return true;
    }
  });

  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(() => {
    try {
      const savedLang = localStorage.getItem('shiuli_lang');
      return !(savedLang === 'bn' || savedLang === 'en');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('shiuli_lang') as Language | null;
      if (savedLang && (savedLang === 'bn' || savedLang === 'en')) {
        setLanguageState(savedLang);
        setIsLanguageChosen(true);
        setShowLanguageModal(false);
      } else {
        setIsLanguageChosen(false);
        setShowLanguageModal(true);
      }
    } catch {
      // localStorage disabled or not available
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setIsLanguageChosen(true);
    setShowLanguageModal(false);
    localStorage.setItem('shiuli_lang', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isLanguageChosen,
        t,
        showLanguageModal,
        setShowLanguageModal,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
