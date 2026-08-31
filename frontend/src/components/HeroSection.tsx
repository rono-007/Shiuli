import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import TrendingModal from './TrendingModal';
import ZoneTourModal from './ZoneTourModal';

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
  const { t, language } = useLanguage();

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
      <ZoneTourModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectZone={onSelectZone}
      />

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