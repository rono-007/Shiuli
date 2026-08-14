import React, { useState } from 'react';
import { 
  Landmark, 
  Utensils, 
  BriefcaseMedical, 
  TrainFront, 
  CalendarDays, 
  MapPin, 
  ArrowRight, 
  Ambulance,
  Bus,
  Megaphone,
  Building2,
  Soup
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { EssentialInfoModal } from './EssentialInfoModal';

interface PujaGuideSectionProps {
  onSelectRoutePlanner?: () => void;
  onSelectFacilities?: () => void;
}

export const PujaGuideSection: React.FC<PujaGuideSectionProps> = ({ onSelectRoutePlanner, onSelectFacilities }) => {
  const { t, language } = useLanguage();
  const [isEssentialModalOpen, setIsEssentialModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isBn = language === 'bn';

  const showDevToast = (featureName: string) => {
    const msg = isBn 
      ? `"${featureName}" বিভাগটি বর্তমানে উন্নয়নাধীন` 
      : `"${featureName}" section is currently Under Development`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cards = [
    {
      id: 'heritage',
      title: isBn ? 'ইতিহাস ও ঐতিহ্য' : 'History & Heritage',
      subtitle: isBn ? 'কলকাতার পুজোর গল্প ও ঐতিহ্য' : 'Stories & heritage of Kolkata Pujas',
      isUnderDev: true,
      items: isBn ? [
        'পুজোর ইতিহাস ও বিবর্তন',
        'প্রসিদ্ধ পুজোর পুরস্কার',
        'ঐতিহ্যের পথেই কলকাতা'
      ] : [
        'History & Evolution of Puja',
        'Famous Puja Awards & Honors',
        'Historic Heritage Walks'
      ],
      icon: <Landmark className="w-5 h-5 text-[#A0353A]" />,
      badgeBg: 'bg-[#F9EAEA]',
      badgeBorder: 'border-[#F0C8C9]',
      btnBg: 'bg-[#FAF6ED] hover:bg-[#F3EBE0] text-[#8C7A6B] border border-[#E5D5C5]',
      watermark: <Building2 className="w-24 h-24 text-[#A0353A]/5 absolute -bottom-3 -right-3 pointer-events-none transition-transform group-hover:scale-110 duration-500" />,
      accentColor: '#A0353A'
    },
    {
      id: 'food',
      title: isBn ? 'খাবারের সন্ধান' : 'Food Directory',
      subtitle: isBn ? 'পুজো পরিক্রমায় সেরা খাবার' : 'Best dining during Puja hopping',
      isUnderDev: false,
      items: isBn ? [
        'সেরা রেস্টুরেন্ট ও ক্যাফে',
        'পাড়া ঘুরে সেরা স্ট্রিট ফুড',
        'ভোজনের ঠিকানাই'
      ] : [
        'Top Restaurants & Cafes',
        'Neighborhood Street Food',
        'Iconic Dining Spots'
      ],
      icon: <Utensils className="w-5 h-5 text-[#C68628]" />,
      badgeBg: 'bg-[#FDF4E5]',
      badgeBorder: 'border-[#F6DCB6]',
      btnBg: 'bg-[#FAF0DA] hover:bg-[#F5E2BD] text-[#B0721B]',
      watermark: <Soup className="w-24 h-24 text-[#C68628]/5 absolute -bottom-3 -right-3 pointer-events-none transition-transform group-hover:scale-110 duration-500" />,
      accentColor: '#C68628'
    },
    {
      id: 'safety',
      title: isBn ? 'সহায়তার গাইড' : 'Help & Safety Guide',
      subtitle: isBn ? 'জরুরি তথ্য, নিরাপদ থাকুন' : 'Emergency info, stay safe',
      isUnderDev: true,
      items: isBn ? [
        'হাসপাতাল ও স্বাস্থ্যকেন্দ্র',
        'পুলিশ ও জরুরি হেল্পলাইন',
        'অ্যাম্বুলেন্স ও সেবা সহায়তা'
      ] : [
        'Hospitals & Health Centers',
        'Police & Emergency Lines',
        'Ambulance & Care Support'
      ],
      icon: <BriefcaseMedical className="w-5 h-5 text-[#4D8357]" />,
      badgeBg: 'bg-[#EEF5ED]',
      badgeBorder: 'border-[#CCE2CB]',
      btnBg: 'bg-[#FAF6ED] hover:bg-[#F3EBE0] text-[#8C7A6B] border border-[#E5D5C5]',
      watermark: <Ambulance className="w-24 h-24 text-[#4D8357]/5 absolute -bottom-3 -right-3 pointer-events-none transition-transform group-hover:scale-110 duration-500" />,
      accentColor: '#4D8357'
    },
    {
      id: 'transit',
      title: isBn ? 'যাতায়াত গাইডলাইন' : 'Transit Guidelines',
      subtitle: isBn ? 'কীভাবে পৌঁছবেন, কোথায় যাবেন' : 'How to reach, where to go',
      isUnderDev: true,
      items: isBn ? [
        'মেট্রো ও ট্রাম/বাস রুট ম্যাপ',
        'পার্কিং ও ট্রাফিক আপডেট',
        'সেরা সময়ে পুজো পরিক্রমা'
      ] : [
        'Metro & Bus Route Maps',
        'Parking & Traffic Updates',
        'Best Timing Recommendations'
      ],
      icon: <TrainFront className="w-5 h-5 text-[#7C579B]" />,
      badgeBg: 'bg-[#F3EFF9]',
      badgeBorder: 'border-[#DCD0EC]',
      btnBg: 'bg-[#FAF6ED] hover:bg-[#F3EBE0] text-[#8C7A6B] border border-[#E5D5C5]',
      watermark: <Bus className="w-24 h-24 text-[#7C579B]/5 absolute -bottom-3 -right-3 pointer-events-none transition-transform group-hover:scale-110 duration-500" />,
      accentColor: '#7C579B'
    },
    {
      id: 'emergency',
      title: isBn ? 'জরুরি তথ্য' : 'Essential Info',
      subtitle: isBn ? 'প্রয়োজনীয় সবকিছু একসাথে' : 'Everything essential together',
      isUnderDev: false,
      items: isBn ? [
        'পুজোর সময়সূচি ও তারিখ',
        'আবহাওয়ার পূর্বাভাস',
        'ঘোষণা ও গুরুত্বপূর্ণ আপডেট'
      ] : [
        'Puja Timings & Dates',
        'Weather Forecasts',
        'Alerts & Key Updates'
      ],
      icon: <CalendarDays className="w-5 h-5 text-[#B84358]" />,
      badgeBg: 'bg-transparent',
      badgeBorder: 'border-transparent',
      btnBg: 'bg-[#F7E4E7] hover:bg-[#F0CFD5] text-[#A83A4E]',
      watermark: <Megaphone className="w-24 h-24 text-[#B84358]/5 absolute -bottom-3 -right-3 pointer-events-none transition-transform group-hover:scale-110 duration-500" />,
      accentColor: '#B84358',
      bgImage: '/essential-card.png'
    }
  ];

  return (
    <section className="w-full bg-[#FAF5EC] bg-[url('/guidline.png')] bg-[length:100%_auto] md:bg-cover bg-top -mt-[2px] pt-14 sm:pt-20 pb-20 px-4 sm:px-8 relative overflow-hidden flex flex-col items-center border-none">
      {/* Toast Notification for Under Development */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-[#3D1418] text-[#FAF5EC] px-5 py-3 rounded-2xl shadow-2xl border border-[#DFB86C]/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 font-serif text-xs sm:text-sm">
          <span className="text-[#DFB86C]">❁</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Gradient Feathering Overlay */}
      <div className="absolute top-0 inset-x-0 h-24 sm:h-28 bg-gradient-to-b from-[#FAF5EC] via-[#FAF5EC]/85 to-transparent pointer-events-none z-[1]" />
      
      <div className="w-full max-w-[1340px] mx-auto flex flex-col items-center relative z-10">
        
        {/* Top Mini Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF0E4]/95 backdrop-blur-md text-[#7A1F26] border border-[#E8D5C4] text-xs font-serif shadow-xs mb-3 sm:mb-4">
          <span className="text-[#C68628]">❁</span>
          <span className="font-semibold tracking-wide">{t.guideSectionTag}</span>
          <span className="text-[#C68628]">❁</span>
        </div>

        {/* Title */}
        <h2 
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-[#5B1015] mb-2 sm:mb-3 text-center tracking-tight font-serif font-bold drop-shadow-xs px-2"
        >
          {t.guideSectionTitle}
        </h2>

        {/* Ornamental Dot & Line Divider */}
        <div className="flex items-center justify-center mb-4 opacity-80 gap-2">
          <div className="w-10 sm:w-12 h-[1px] bg-[#A0353A]/40"></div>
          <span className="text-[#A0353A] text-xs">❁</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#A0353A]"></div>
          <span className="text-[#A0353A] text-xs">❁</span>
          <div className="w-10 sm:w-12 h-[1px] bg-[#A0353A]/40"></div>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-[#5C4235] text-center max-w-2xl mb-8 sm:mb-12 font-serif px-2">
          {t.guideSectionSubtitle}
        </p>

        {/* 5 Feature Cards Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 justify-center mb-10">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="rounded-3xl border border-[#EADECF] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 px-5 pt-20 pb-6 flex flex-col items-center relative overflow-hidden group min-h-[380px] bg-cover bg-center"
              style={{ backgroundImage: "url('/essential-card.png')" }}
            >
              {/* Under Development Top Badge */}
              {card.isUnderDev && (
                <div className="absolute top-4 left-4 bg-[#7A6458]/15 border border-[#7A6458]/30 px-2.5 py-0.5 rounded-full text-[10px] font-serif font-semibold text-[#6E5548] tracking-wider uppercase">
                  {isBn ? 'উন্নয়নাধীন' : 'Under Development'}
                </div>
              )}

              {/* Background Watermark Icon */}
              {card.watermark}

              {/* Card Title */}
              <h3 className="text-lg text-[#3D1418] mb-1 text-center font-serif font-bold leading-tight">
                {card.title}
              </h3>

              {/* Subtitle */}
              <p className="text-[11px] text-[#7A6458] mb-4 text-center font-serif leading-snug">
                {card.subtitle}
              </p>

              {/* Ornamental Divider Line */}
              <div className="w-full flex items-center justify-center gap-1.5 mb-5 opacity-60">
                <div className="w-6 h-[0.75px] bg-[#C6A48D]" />
                <span className="text-[9px]" style={{ color: card.accentColor }}>❁</span>
                <div className="w-6 h-[0.75px] bg-[#C6A48D]" />
              </div>

              {/* Bullets List with Floral Bullets */}
              <ul className="w-full space-y-3 mb-6 flex-1">
                {card.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 group/item text-left">
                    <span 
                      className="text-xs flex-shrink-0 mt-0.5" 
                      style={{ color: card.accentColor }}
                    >
                      ❁
                    </span>
                    <span className="text-[12px] text-[#4A3930] leading-snug font-serif group-hover/item:text-[#2A1D16] transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Pill Button */}
              <div className="w-full pt-2 mt-auto">
                <button 
                  onClick={() => {
                    if (card.id === 'food') {
                      onSelectFacilities?.();
                    } else if (card.id === 'emergency') {
                      setIsEssentialModalOpen(true);
                    } else {
                      showDevToast(card.title);
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between text-xs font-serif font-bold transition-all duration-300 ${card.btnBg} cursor-pointer shadow-2xs group/btn`}
                >
                  <span>
                    {card.isUnderDev 
                      ? (isBn ? 'উন্নয়নাধীন' : 'Under Development')
                      : (isBn ? 'বিস্তারিত দেখুন' : 'View Details')}
                  </span> 
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Banner Card: Route Planner Banner */}
        <div className="w-full max-w-[1300px] bg-[#F5EBE1] border border-[#E5D2C2] rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden text-center sm:text-left">
          
          {/* Dashed Route Path Decorative Overlay */}
          <div className="absolute right-36 bottom-2 w-64 h-12 opacity-20 pointer-events-none text-[#921925] hidden md:block">
            <svg viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
              <path d="M 10 30 Q 60 5 110 30 T 190 10" />
              <circle cx="10" cy="30" r="3" fill="currentColor" />
              <circle cx="190" cy="10" r="3" fill="currentColor" />
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-[#F0DCD0] flex items-center justify-center flex-shrink-0 text-[#921925]">
              <MapPin className="w-6 h-6 fill-[#921925] text-[#F0DCD0]" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-serif font-bold text-[#5B1015] mb-0.5">
                {t.routePlannerTitle}
              </h4>
              <p className="text-xs md:text-sm text-[#7A5B4C] font-serif max-w-lg">
                {t.routePlannerSubtitle}
              </p>
            </div>
          </div>

          <button 
            onClick={onSelectRoutePlanner}
            className="w-full sm:w-auto justify-center bg-[#921925] hover:bg-[#78141D] text-white font-serif font-semibold text-xs md:text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>{t.routePlannerBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Tagline */}
        <div className="mt-8 text-center text-xs font-serif text-[#7A5B4C] flex items-center justify-center gap-2">
          <span className="text-[#C68628]">❁</span>
          <span>{t.footerTagline}</span>
          <span className="text-[#C68628]">❁</span>
        </div>

      </div>

      {/* Essential Info Modal */}
      <EssentialInfoModal 
        isOpen={isEssentialModalOpen} 
        onClose={() => setIsEssentialModalOpen(false)} 
      />
    </section>
  );
};

export default PujaGuideSection;
