import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 bg-[#FAF6ED]/95 hover:bg-white text-[#7A1F26] border border-[#7A1F26]/30 px-3 py-1.5 rounded-full text-xs font-serif font-bold shadow-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
      title="Switch Language / ভাষা পরিবর্তন করুন"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
    </button>
  );
};
