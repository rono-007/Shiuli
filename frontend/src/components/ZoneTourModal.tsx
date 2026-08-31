import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ZoneTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectZone: (zone: 'north' | 'central' | 'south' | 'bonedi') => void;
}

export const ZoneTourModal: React.FC<ZoneTourModalProps> = ({
  isOpen,
  onClose,
  onSelectZone,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

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
    <div 
      onClick={onClose}
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
            onClose();
          }}
          aria-label="Close tour directory"
          className="absolute top-5 right-5 w-9 h-9 rounded-full border border-[#3D2C22]/15 bg-[#FAF6ED] flex items-center justify-center text-[#3D2C22]/70 hover:text-[#7A1F26] hover:bg-white hover:border-[#7A1F26]/40 transition-all duration-200 z-20 cursor-pointer shadow-xs active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5 sm:space-y-6 relative z-10">
          <div className="text-center pb-3 sm:pb-4 border-b border-[#3D2C22]/10 space-y-1">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#7A1F26] font-semibold block">
              {t.modalGuideTag}
            </span>
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
                    onClose();
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
  );
};

export default ZoneTourModal;
