import React from 'react';
import { 
  Train, 
  Fuel, 
  CreditCard, 
  Hospital, 
  Pill, 
  Bath, 
  Shield, 
  Layers 
} from 'lucide-react';
import { 
  useNearbyFacilities, 
  type NearbyFacility, 
  type NearbyMetroStation 
} from '../utils/nearbyFacilities';

interface NearbyFacilitiesGridProps {
  pandalLat: number;
  pandalLon: number;
  selectedFacilityTitle?: string | null;
  onFacilityClick?: (
    item: NearbyFacility | NearbyMetroStation, 
    icon: string, 
    color: string
  ) => void;
  isMapMode?: boolean;
}

export const NearbyFacilitiesGrid: React.FC<NearbyFacilitiesGridProps> = ({
  pandalLat,
  pandalLon,
  selectedFacilityTitle,
  onFacilityClick,
  isMapMode = false
}) => {
  const { facilities, loading } = useNearbyFacilities(pandalLat, pandalLon);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-serif font-bold text-ink/50 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 animate-pulse text-bengali-red" />
          <span>নিকটবর্তী সুবিধাসমূহ খোঁজা হচ্ছে...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-ink/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!facilities) {
    return null;
  }

  const items = [
    {
      key: 'metro',
      data: facilities.metro,
      icon: '🚇',
      lucideIcon: Train,
      color: '#8B1E2D',
      bgLight: 'bg-bengali-red/5',
      borderLight: 'border-bengali-red/20 hover:border-bengali-red/50',
      activeRing: 'border-bengali-red ring-2 ring-bengali-red/30 bg-bengali-red/10',
      label: 'মেট্রো স্টেশন',
      isFullWidth: true
    },
    {
      key: 'hospital',
      data: facilities.hospital,
      icon: '🏥',
      lucideIcon: Hospital,
      color: '#E11D48',
      bgLight: 'bg-rose-50/50',
      borderLight: 'border-rose-200/60 hover:border-rose-400',
      activeRing: 'border-rose-600 ring-2 ring-rose-500/30 bg-rose-50',
      label: 'হাসপাতাল / নার্সিং হোম',
      isFullWidth: false
    },
    {
      key: 'pharmacy',
      data: facilities.pharmacy,
      icon: '💊',
      lucideIcon: Pill,
      color: '#7C3AED',
      bgLight: 'bg-purple-50/50',
      borderLight: 'border-purple-200/60 hover:border-purple-400',
      activeRing: 'border-purple-600 ring-2 ring-purple-500/30 bg-purple-50',
      label: 'ওষুধের দোকান / ফার্মেসি',
      isFullWidth: false
    },
    {
      key: 'toilet',
      data: facilities.toilet,
      icon: '🚻',
      lucideIcon: Bath,
      color: '#0284C7',
      bgLight: 'bg-sky-50/50',
      borderLight: 'border-sky-200/60 hover:border-sky-400',
      activeRing: 'border-sky-600 ring-2 ring-sky-500/30 bg-sky-50',
      label: 'পাবলিক শৌচালয়',
      isFullWidth: false
    },
    {
      key: 'petrolPump',
      data: facilities.petrolPump,
      icon: '⛽',
      lucideIcon: Fuel,
      color: '#D97706',
      bgLight: 'bg-amber-50/50',
      borderLight: 'border-amber-200/60 hover:border-amber-400',
      activeRing: 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-50',
      label: 'পেট্রোল পাম্প',
      isFullWidth: false
    },
    {
      key: 'atm',
      data: facilities.atm,
      icon: '💳',
      lucideIcon: CreditCard,
      color: '#059669',
      bgLight: 'bg-emerald-50/50',
      borderLight: 'border-emerald-200/60 hover:border-emerald-400',
      activeRing: 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50',
      label: 'এটিএম / ব্যাংক',
      isFullWidth: false
    },
    {
      key: 'police',
      data: facilities.police,
      icon: '🚓',
      lucideIcon: Shield,
      color: '#2563EB',
      bgLight: 'bg-blue-50/50',
      borderLight: 'border-blue-200/60 hover:border-blue-400',
      activeRing: 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50',
      label: 'পুলিশ স্টেশন / ফাঁড়ি',
      isFullWidth: false
    }
  ];

  // Filter out categories that didn't find any match
  const availableItems = items.filter(item => item.data !== null && item.data !== undefined);

  if (availableItems.length === 0) {
    return (
      <div className="bg-ink/5 p-4 rounded-2xl text-center text-xs text-ink/60 font-sans">
        কাছাকাছি ১ কিমির মধ্যে কোনো জরুরি সুবিধা পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-serif font-bold text-ink/60 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-bengali-red" />
          <span>জরুরি সুবিধাসমূহ ({isMapMode ? 'ক্লিক করে মানচিত্রে দেখুন' : 'Real Nearby Facilities'})</span>
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        {availableItems.map(item => {
          const facility = item.data!;
          const isSelected = selectedFacilityTitle === facility.title;
          const LucideIcon = item.lucideIcon;

          const walkText = 'estimatedWalkMinutes' in facility && facility.estimatedWalkMinutes 
            ? `~${facility.estimatedWalkMinutes} min হাঁটা` 
            : null;

          const cardContent = (
            <div className="flex items-start gap-2.5 w-full min-w-0">
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs"
                style={{ backgroundColor: `${item.color}15`, color: item.color }}
              >
                <LucideIcon className="w-4 h-4" style={{ color: item.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <span 
                    className="font-serif font-bold text-ink truncate group-hover:underline text-[11px] sm:text-xs"
                    title={facility.title}
                  >
                    {item.icon} {facility.title}
                  </span>
                  <span 
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    {facility.distanceText}
                  </span>
                </div>

                <div className="text-[10px] font-sans text-ink/60 mt-0.5 flex items-center justify-between min-w-0 gap-1">
                  <span className="truncate" title={facility.subTitle || facility.address || item.label}>
                    {facility.subTitle || facility.address || item.label}
                  </span>
                  {walkText ? (
                    <span className="text-[9px] font-mono text-ink/50 flex-shrink-0 whitespace-nowrap">
                      {walkText}
                    </span>
                  ) : (
                    <span 
                      className="text-[9px] font-bold flex-shrink-0 whitespace-nowrap"
                      style={{ color: item.color }}
                    >
                      {isMapMode ? '📍 মানচিত্রে' : 'GPS ↗'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );

          if (isMapMode && onFacilityClick) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFacilityClick(facility, item.icon, item.color)}
                className={`p-2.5 rounded-xl border text-left transition-all group min-w-0 cursor-pointer shadow-xs ${
                  item.isFullWidth ? 'col-span-1 sm:col-span-2' : 'col-span-1'
                } ${
                  isSelected ? item.activeRing : `${item.bgLight} ${item.borderLight} text-ink/80`
                }`}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <a
              key={item.key}
              href={facility.url || `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-xl border text-left transition-all group min-w-0 block shadow-xs ${
                item.isFullWidth ? 'col-span-1 sm:col-span-2' : 'col-span-1'
              } ${item.bgLight} ${item.borderLight} text-ink/80`}
            >
              {cardContent}
            </a>
          );
        })}
      </div>
    </div>
  );
};
