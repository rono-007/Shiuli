import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import TrendingModal from './TrendingModal';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  activeFilter?: string;
  onSelectZone: (zone: 'north' | 'central' | 'south' | 'bonedi') => void;
  onSelectFacilities?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSelectZone }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrendingModalOpen, setIsTrendingModalOpen] = useState(false);
  const { t } = useLanguage();

  const zones = [
    { 
      id: 'north', 
      serial: 'NO-A', 
      name: t.zoneNorthName, 
      subtitle: t.zoneNorthSubtitle, 
      desc: t.zoneNorthDesc, 
      active: true, 
      bgImage: '/tour_card_north.png' 
    },
    { 
      id: 'central', 
      serial: 'CE-B', 
      name: t.zoneCentralName, 
      subtitle: t.zoneCentralSubtitle, 
      desc: t.zoneCentralDesc, 
      active: true, 
      bgImage: '/tour_card_central.png' 
    },
    { 
      id: 'south', 
      serial: 'SO-C', 
      name: t.zoneSouthName, 
      subtitle: t.zoneSouthSubtitle, 
      desc: t.zoneSouthDesc, 
      active: true, 
      bgImage: '/tour_card_south.png' 
    },
    { 
      id: 'bonedi', 
      serial: 'BN-D', 
      name: t.zoneBonediName, 
      subtitle: t.zoneBonediSubtitle, 
      desc: t.zoneBonediDesc, 
      active: true, 
      bgImage: '/tour_card_bonedi.png' 
    }
  ];

  return (
    <section className="relative w-full min-h-fit lg:h-[100svh] lg:min-h-[700px] bg-[#F7F2E7] flex flex-col justify-center items-center overflow-hidden pt-20 pb-[12vw] sm:pt-16 lg:pb-0 px-4 sm:px-8 lg:px-12 selection:bg-[#983335] selection:text-white">

      {/* Full Bleed Full-Screen Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/her-banner.png"
          alt="Durga Puja Hero Banner"
          className="w-full h-full object-cover object-[80%_center] sm:object-[75%_center] lg:object-fill lg:object-top"
        />

        {/* Mobile dark scrim overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A0E10]/80 via-[#3B1417]/50 to-transparent lg:hidden pointer-events-none z-0" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-[1920px] mx-auto flex flex-col lg:flex-row items-center justify-between my-auto">

        {/* LEFT COMPOSITION: Headline, Subtitle & Pill-shaped CTA Buttons */}
        <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col items-center lg:items-start text-center lg:text-left animate-fade-in-slow px-4 sm:px-8 lg:px-12 py-8 relative z-10">

          {/* Main Editorial Headline */}
          <h1
            className="text-[2.15rem] xs:text-[2.65rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.75rem] xl:text-[5.5rem] leading-[1.18] text-[#FAF6ED] font-bold tracking-tight mb-4 sm:mb-6 cursor-default drop-shadow-xl"
            style={{ fontFamily: language === 'bn' ? "'Noto Serif Bengali', serif" : 'serif', fontWeight: 700 }}
          >
            {t.heroTitleLine1}<br />
            {t.heroTitleLine2}
          </h1>

          {/* Supporting Paragraph */}
          <div className="max-w-xl mb-6 sm:mb-10 px-2 sm:px-0">
            <p
              className="text-sm xs:text-base sm:text-lg md:text-xl text-[#F7F2E7] leading-relaxed font-medium drop-shadow-md whitespace-pre-line"
              style={{ fontFamily: language === 'bn' ? "'Noto Sans Bengali', sans-serif" : 'sans-serif' }}
            >
              {t.heroSubtitle1}<br />
              {t.heroSubtitle2}<br />
              {t.heroSubtitle3}
            </p>
          </div>

          {/* Pill-shaped CTA Buttons */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-5 px-2 sm:px-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative w-full sm:w-auto px-7 py-3.5 sm:px-9 sm:py-4 rounded-full bg-[#FAF6ED] hover:bg-[#FFFDFA] text-[#7A1F26] text-sm sm:text-base md:text-lg font-bold shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 overflow-hidden text-center flex items-center justify-center cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t.heroCtaPrimary}
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </button>

            <button
              onClick={() => setIsTrendingModalOpen(true)}
              className="group relative w-full sm:w-auto px-7 py-3.5 sm:px-9 sm:py-4 rounded-full border-2 border-[#FAF6ED] text-[#FAF6ED] bg-[#7A1F26]/70 lg:bg-transparent hover:bg-[#FAF6ED]/20 text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 overflow-hidden text-center flex items-center justify-center backdrop-blur-md shadow-md cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t.heroCtaSecondary}
                <span className="inline-block transition-transform duration-300 group-hover:rotate-12">✦</span>
              </span>
            </button>
          </div>

        </div>

        {/* RIGHT AREA: Desktop-only artwork positioning spacer */}
        <div className="hidden lg:block relative z-0 w-full lg:w-[45%] xl:w-[50%] h-full pointer-events-none animate-float-slow" />

      </div>

      {/* Zone Selector Modal matching editorial theme */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-[#3D2C22]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-fast"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F8F4EA] text-[#3D2C22] w-full max-w-[560px] p-4.5 xs:p-6 sm:p-8 border-2 border-[#D4A24C]/40 shadow-2xl relative rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden"
          >

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              aria-label="Close tour directory"
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-[#3D2C22]/15 bg-[#FAF6ED] flex items-center justify-center text-[#3D2C22]/70 hover:text-[#7A1F26] hover:bg-white hover:border-[#7A1F26]/40 transition-all duration-200 z-20 cursor-pointer shadow-xs active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5 sm:space-y-6 relative z-10">
              <div className="text-center pb-3 sm:pb-4 border-b border-[#3D2C22]/10 space-y-1">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#7A1F26] font-semibold block">{t.modalGuideTag}</span>
                <h3 className="text-2xl sm:text-3xl font-serif text-[#63141A] font-bold tracking-tight">
                  {t.modalTitle}
                </h3>
              </div>

              <div className="space-y-3 sm:space-y-3.5">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    disabled={!zone.active}
                    onClick={() => {
                      if (zone.active) {
                        onSelectZone(zone.id as 'north' | 'central' | 'south' | 'bonedi');
                        setIsModalOpen(false);
                      }
                    }}
                    className="group w-full text-left relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer border border-amber-900/10 focus:outline-none focus:ring-2 focus:ring-[#7A1F26]/30 aspect-[1179/290] bg-[#FAF6ED]"
                  >
                    {/* Background Artwork without distortion or cropping */}
                    <img
                      src={zone.bgImage}
                      alt={zone.name}
                      className="absolute inset-0 w-full h-full object-cover object-left select-none pointer-events-none transition-transform duration-500 group-hover:scale-[1.01]"
                      loading="eager"
                    />

                    {/* Text placed cleanly inside the cream placeholder box */}
                    <div className="absolute inset-y-0 left-[30%] xs:left-[30%] sm:left-[29.5%] md:left-[29%] right-[3.5%] sm:right-[5%] flex flex-col justify-center px-1 xs:px-2 sm:px-3.5 z-10 select-none">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1">
                        <h4 className="text-[12.5px] xs:text-[14px] sm:text-base md:text-lg font-bold text-[#63141A] tracking-tight font-serif truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                          {zone.name}
                        </h4>
                        <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-mono font-bold text-[#7A1F26] bg-[#7A1F26]/10 border border-[#7A1F26]/20 px-1.5 py-0.5 rounded sm:rounded-md tracking-wider flex-shrink-0">
                          {zone.serial}
                        </span>
                      </div>
                      <p className="text-[8.5px] xs:text-[10px] sm:text-xs md:text-[13px] text-[#45271A]/90 font-sans leading-tight sm:leading-snug line-clamp-1 sm:line-clamp-2">
                        {zone.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] font-mono text-[#3D2C22]/40 tracking-[0.2em] uppercase">
                  {t.modalFooterTag}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Pandals Intelligence Modal */}
      <TrendingModal
        isOpen={isTrendingModalOpen}
        onClose={() => setIsTrendingModalOpen(false)}
        onSelectZone={onSelectZone}
      />
    </section>
  );
};

export default HeroSection;