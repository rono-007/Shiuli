import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Check } from 'lucide-react';
import type { Language } from '../i18n/translations';

export const InitialLanguageModal: React.FC = () => {
  const { showLanguageModal, language, setLanguage, setShowLanguageModal, isLanguageChosen } = useLanguage();
  const [selected, setSelected] = useState<Language>(language || 'bn');

  if (!showLanguageModal) return null;

  const handleSelect = (lang: Language) => {
    setSelected(lang);
  };

  const handleConfirm = () => {
    setLanguage(selected);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#2A0E10]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-[#FAF6ED] text-[#3D0D11] w-full max-w-lg border-2 border-[#D4A24C]/40 shadow-2xl rounded-3xl overflow-hidden relative p-6 sm:p-8 font-serif">
        
        {/* Background Decorative Floral Accents */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7A1F26]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#D4A24C]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Logo & Title */}
        <div className="text-center space-y-3 relative z-10 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7A1F26]/10 text-[#7A1F26] border border-[#7A1F26]/20 text-xs font-mono tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kolkata Puja Companion</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-[#3D0D11] tracking-tight">
            শিউলিতে স্বাগতম
          </h2>
          <p className="text-sm sm:text-base text-[#6B181E] font-medium leading-relaxed">
            Welcome to Shiuli • Choose your preferred language<br />
            <span className="text-xs text-[#3D0D11]/60">আপনার পছন্দের ভাষা বেছে নিন</span>
          </p>
        </div>

        {/* Language Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-8">
          
          {/* Bengali Option */}
          <button
            onClick={() => handleSelect('bn')}
            className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
              selected === 'bn'
                ? 'border-[#7A1F26] bg-[#7A1F26]/10 shadow-lg scale-[1.02]'
                : 'border-[#3D0D11]/15 bg-white/70 hover:border-[#7A1F26]/40 hover:bg-white'
            }`}
          >
            {selected === 'bn' && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7A1F26] text-white flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
            
            <div className="space-y-2">
              <span className="text-2xl">🌸</span>
              <h3 className="text-xl font-bold text-[#3D0D11]">
                বাংলা
              </h3>
              <p className="text-xs text-[#6B181E]/80 leading-relaxed font-sans">
                সম্পূর্ণ ওয়েবসাইট ও গল্পগুলো বাংলায় দেখুন।
              </p>
            </div>

            <div className="mt-4 text-[10px] font-mono tracking-wider text-[#7A1F26] font-semibold uppercase">
              Bengali Language
            </div>
          </button>

          {/* English Option */}
          <button
            onClick={() => handleSelect('en')}
            className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
              selected === 'en'
                ? 'border-[#7A1F26] bg-[#7A1F26]/10 shadow-lg scale-[1.02]'
                : 'border-[#3D0D11]/15 bg-white/70 hover:border-[#7A1F26]/40 hover:bg-white'
            }`}
          >
            {selected === 'en' && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7A1F26] text-white flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-2xl">🌐</span>
              <h3 className="text-xl font-bold text-[#3D0D11]">
                English
              </h3>
              <p className="text-xs text-[#6B181E]/80 leading-relaxed font-sans">
                Explore guides, route maps & pandals in English.
              </p>
            </div>

            <div className="mt-4 text-[10px] font-mono tracking-wider text-[#7A1F26] font-semibold uppercase">
              English Language
            </div>
          </button>

        </div>

        {/* Continue Button */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <button
            onClick={() => handleConfirm()}
            className="w-full py-4 px-6 rounded-2xl bg-[#7A1F26] hover:bg-[#8B1E2D] text-[#FAF6ED] font-serif font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{selected === 'bn' ? 'এগিয়ে যান' : 'Explore Shiuli'}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>

          {isLanguageChosen && (
            <button
              onClick={() => setShowLanguageModal(false)}
              className="text-xs text-[#3D0D11]/60 hover:text-[#7A1F26] transition-colors py-1"
            >
              Cancel / বাতিল করুন
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
