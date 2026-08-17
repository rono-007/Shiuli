import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Hospital, 
  Pill, 
  Phone, 
  MapPin, 
  Search, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Layers,
  ArrowRight,
  ShieldAlert,
  Map as MapIcon,
  List as ListIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { MedicalMap } from './MedicalMap';
import { secureGetItem, secureSetItem } from '../utils/storage';

export interface MedicalFacility {
  title: string;
  subTitle?: string;
  categoryName?: string;
  type: string;
  address?: string;
  phone?: string;
  location: { lat: number; lng: number };
  url: string;
}

interface MedicalFacilitiesResponse {
  north: MedicalFacility[];
  south: MedicalFacility[];
}

interface MedicalFacilitiesSectionProps {
  onBack: () => void;
}

const MedicalFacilitiesSection: React.FC<MedicalFacilitiesSectionProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [activeZone, setActiveZone] = useState<'north' | 'south'>('north');
  const [filterType, setFilterType] = useState<'all' | 'hospital' | 'pharmacy' | 'police' | 'ambulance'>('all');
  const [data, setData] = useState<MedicalFacilitiesResponse>({ north: [], south: [] });
  const [selectedFacility, setSelectedFacility] = useState<MedicalFacility | null>(null);
  const [mobileView, setMobileView] = useState<'split' | 'list' | 'map'>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRefs = useRef<{ [title: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedFacility && cardRefs.current[selectedFacility.title]) {
      cardRefs.current[selectedFacility.title]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedFacility]);

  const CACHE_KEY = 'shiuli_medical_facilities_cache';
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  const fetchMedicalFacilities = async () => {
    setError(null);

    // 1. Check valid localStorage cache first
    try {
      const cached = secureGetItem<{ timestamp: number; data: any }>(CACHE_KEY);
      if (cached) {
        if (cached.data && (Date.now() - cached.timestamp < CACHE_TTL)) {
          if (Array.isArray(cached.data.north) && Array.isArray(cached.data.south)) {
            setData(cached.data);
            setLoading(false);
            // Fetch in background to update cache silently
            fetchFromApiOrFallback(true);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Medical facilities cache read error:', e);
    }

    setLoading(true);
    await fetchFromApiOrFallback(false);
  };

  const fetchFromApiOrFallback = async (isBackground = false) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';
    try {
      const res = await fetch(`${baseUrl}/api/medical-facilities`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result = await res.json();
      if (result && Array.isArray(result.north) && Array.isArray(result.south)) {
        setData(result);
        secureSetItem(CACHE_KEY, { timestamp: Date.now(), data: result });
        if (!isBackground) setLoading(false);
        return;
      }
      throw new Error('Invalid backend data format');
    } catch (err: any) {
      console.warn('Backend fetch failed for medical facilities, attempting local dataset fallback:', err);
      try {
        const [northF, southF] = await Promise.all([
          import('../data/north_other_facilities.json').then(m => ((m.default || m) as any[])).catch(() => []),
          import('../data/south_other_facilities.json').then(m => ((m.default || m) as any[])).catch(() => [])
        ]);

        const officialHelplines = [
          {
            title: "Kolkata Police Emergency Control Room (Lalbazar)",
            subTitle: "24x7 Central Emergency Control Room",
            categoryName: "Police & Emergency Control",
            type: "Police & Helpline",
            address: "Lalbazar Street, Bowbazar, Kolkata, West Bengal 700001",
            phone: "100 / 033-2214-3024",
            location: { lat: 22.5732, lng: 88.3533 },
            url: "https://www.google.com/maps/search/?api=1&query=22.5732,88.3533"
          },
          {
            title: "Kolkata Police Women Helpline",
            subTitle: "24x7 Dedicated Women Safety Support",
            categoryName: "Women Helpline",
            type: "Police & Helpline",
            address: "Lalbazar Headquarters, Kolkata, West Bengal 700001",
            phone: "1091 / 033-2214-1913",
            location: { lat: 22.5732, lng: 88.3533 },
            url: "https://www.google.com/maps/search/?api=1&query=22.5732,88.3533"
          },
          {
            title: "West Bengal Emergency Ambulance Service",
            subTitle: "State Medical Emergency & Care Support",
            categoryName: "Ambulance & Care Support",
            type: "Ambulance & Care",
            address: "Swasthya Bhawan, Salt Lake, Kolkata, West Bengal 700091",
            phone: "102 / 033-2286-0000",
            location: { lat: 22.5726, lng: 88.4312 },
            url: "https://www.google.com/maps/search/?api=1&query=22.5726,88.4312"
          },
          {
            title: "Kolkata Fire Brigade Control Room",
            subTitle: "24x7 Fire & Disaster Emergency",
            categoryName: "Fire Brigade",
            type: "Police & Helpline",
            address: "13D, Mirza Ghalib St, Esplanade, Kolkata, West Bengal 700016",
            phone: "101 / 033-2252-1165",
            location: { lat: 22.5552, lng: 88.3551 },
            url: "https://www.google.com/maps/search/?api=1&query=22.5552,88.3551"
          }
        ];

        const filterMedical = (dataset: any[]) => {
          return dataset.filter(item => {
            if (!item || !item.location) return false;
            const cat = (item.categoryName || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            const rawCats = item.categories;
            const catsStr = Array.isArray(rawCats) ? rawCats.join(' ').toLowerCase() : String(rawCats || '').toLowerCase();
            const blob = `${title} ${cat} ${catsStr}`;
            return blob.includes('hospital') || blob.includes('nursing') || blob.includes('clinic') || blob.includes('pharmacy') || blob.includes('chemist') || blob.includes('medicine') || blob.includes('police') || blob.includes('ambulance') || blob.includes('হাসপাতাল') || blob.includes('ফার্মেসি') || blob.includes('থানা') || blob.includes('পুলিশ');
          }).map(item => {
            const cat = (item.categoryName || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            let typeName = 'Pharmacy & Medical Store';
            if (title.includes('hospital') || cat.includes('hospital') || title.includes('nursing') || cat.includes('nursing')) {
              typeName = 'Hospital & Nursing Home';
            } else if (title.includes('police') || cat.includes('police') || title.includes('থানা')) {
              typeName = 'Police & Helpline';
            } else if (title.includes('ambulance') || cat.includes('ambulance')) {
              typeName = 'Ambulance & Care';
            }

            return {
              title: item.title,
              subTitle: item.subTitle,
              categoryName: item.categoryName,
              type: typeName,
              address: item.address,
              phone: item.phone,
              location: item.location,
              url: item.url || `https://www.google.com/maps/search/?api=1&query=${item.location.lat},${item.location.lng}`
            };
          });
        };

        const fallbackResult = {
          north: [...officialHelplines, ...filterMedical(northF)],
          south: [...officialHelplines, ...filterMedical(southF)]
        };

        setData(fallbackResult);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: fallbackResult }));
      } catch (fallbackErr) {
        if (!isBackground) setError(isBn ? 'ডাটা লোড করা সম্ভব হয়নি।' : 'Failed to load emergency & medical facilities data.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalFacilities();
  }, [isBn]);

  const currentList = data[activeZone] || [];

  const filteredItems = currentList.filter(item => {
    const isHospital = item.type.includes('Hospital');
    const isPharmacy = item.type.includes('Pharmacy');
    const isPolice = item.type.includes('Police');
    const isAmbulance = item.type.includes('Ambulance');

    if (filterType === 'hospital' && !isHospital) return false;
    if (filterType === 'pharmacy' && !isPharmacy) return false;
    if (filterType === 'police' && !isPolice) return false;
    if (filterType === 'ambulance' && !isAmbulance) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const addr = (item.address || '').toLowerCase();
    const cat = (item.categoryName || '').toLowerCase();

    return title.includes(q) || addr.includes(q) || cat.includes(q);
  });

  return (
    <section className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat text-[#2C1810] pt-24 sm:pt-28 pb-20 px-4 sm:px-8 lg:px-12 relative font-serif" style={{ backgroundImage: "url('/medical_page.png')" }}>
      
      {/* Dark & Vintage Vignette Overlay to ensure text readability */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/40 backdrop-blur-[2px]"></div>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="max-w-[1400px] mx-auto relative z-10 space-y-6 sm:space-y-8">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-[#EAE0D0] shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#8C1D24] hover:text-[#5B1015] transition-colors cursor-pointer bg-[#F7EBE8] px-3 py-1.5 rounded-full border border-[#8C1D24]/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isBn ? 'ফিরে যান' : 'Back'}</span>
              </button>
              <span className="text-xs text-[#8C7A6B] font-serif">
                {isBn ? 'সহায়তার গাইড • সরাসরি ব্যাকএন্ড ডাটা' : 'Help & Safety Guide • Live Backend Data'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-[#3D0D11] tracking-tight">
              {isBn ? 'হাসপাতাল, নার্সিং হোম ও ফার্মেসি ডিরেক্টরি' : 'Hospitals, Nursing Homes & Pharmacies'}
            </h1>
            <p className="text-xs sm:text-sm font-serif text-[#6E5D52] max-w-3xl leading-relaxed">
              {isBn 
                ? 'পুজো পরিক্রমায় জরুরি চিকিৎসার প্রয়োজনে উত্তর ও দক্ষিণ কলকাতার ভেরিফায়েড হাসপাতাল, ২৪/৭ ফার্মেসি এবং ইমার্জেন্সি লাইনের মানচিত্র নির্দেশিকা।'
                : 'Complete directory & interactive map of verified hospitals, nursing homes, 24/7 pharmacies, and emergency helplines across Kolkata.'}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchMedicalFacilities} 
              disabled={loading}
              className="flex items-center gap-2 bg-[#8C1D24] hover:bg-[#6E161C] text-white px-5 py-2.5 rounded-2xl text-xs font-serif font-bold transition-all cursor-pointer disabled:opacity-50 shadow-md active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isBn ? 'ডাটা রিফ্রেশ' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Filters Navigation Bar - Matching Screenshot Layout */}
        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-[#EAE0D0] shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Zone Selector Pills */}
          <div className="flex bg-[#F2ECE1] p-1.5 rounded-2xl w-full lg:w-auto">
            <button
              onClick={() => { setActiveZone('north'); setSelectedFacility(null); }}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-serif transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeZone === 'north'
                  ? 'bg-[#8C1D24] text-white shadow-md'
                  : 'text-[#6E5D52] hover:text-[#3D0D11]'
              }`}
            >
              <span>🏛️</span>
              <span>{isBn ? 'উত্তর কলকাতা' : 'North Kolkata'} ({data.north.length})</span>
            </button>
            <button
              onClick={() => { setActiveZone('south'); setSelectedFacility(null); }}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-serif transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeZone === 'south'
                  ? 'bg-[#8C1D24] text-white shadow-md'
                  : 'text-[#6E5D52] hover:text-[#3D0D11]'
              }`}
            >
              <span>🌳</span>
              <span>{isBn ? 'দক্ষিণ কলকাতা' : 'South Kolkata'} ({data.south.length})</span>
            </button>
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-2 flex-wrap justify-center w-full lg:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#8C1D24] text-white shadow-sm'
                  : 'bg-[#F5EFE6] text-[#6E5D52] hover:bg-[#EAE0D0]'
              }`}
            >
              {isBn ? 'সব কেন্দ্র' : 'All'}
            </button>
            
            <button
              onClick={() => setFilterType('hospital')}
              className={`px-4 py-2 rounded-full text-xs font-serif font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'hospital'
                  ? 'bg-[#E11D48] text-white shadow-sm'
                  : 'bg-[#FCE7F0] text-[#9F1239] hover:bg-[#FCD3E1]'
              }`}
            >
              <Hospital className="w-3.5 h-3.5" />
              <span>{isBn ? 'হাসপাতাল' : 'Hospitals'}</span>
            </button>

            <button
              onClick={() => setFilterType('pharmacy')}
              className={`px-4 py-2 rounded-full text-xs font-serif font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'pharmacy'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'bg-[#F3E8FF] text-[#6B21A8] hover:bg-[#E9D5FF]'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>{isBn ? 'ফার্মেসি' : 'Pharmacies'}</span>
            </button>

            <button
              onClick={() => setFilterType('police')}
              className={`px-4 py-2 rounded-full text-xs font-serif font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'police'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#EFF6FF] text-[#1E40AF] hover:bg-[#DBEAFE]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isBn ? 'পুলিশ' : 'Police'}</span>
            </button>

            <button
              onClick={() => setFilterType('ambulance')}
              className={`px-4 py-2 rounded-full text-xs font-serif font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'ambulance'
                  ? 'bg-[#10B981] text-white shadow-sm'
                  : 'bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5]'
              }`}
            >
              <Hospital className="w-3.5 h-3.5" />
              <span>{isBn ? 'অ্যাম্বুলেন্স' : 'Ambulance'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? "হাসপাতাল বা এলাকার নাম খুঁজুন..." : "Search hospital, pharmacy, area..."}
              className="w-full pl-10 pr-8 py-2.5 bg-[#F9F5EC] border border-[#EADECF] rounded-full text-xs font-serif placeholder-[#8C7A6B] focus:outline-none focus:border-[#8C1D24]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#3D0D11] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area: Side-by-Side Split View (Cards Left, Interactive Map Right) */}
        <div className="bg-white/90 backdrop-blur-md border border-[#EAE0D0] rounded-3xl p-4 sm:p-6 lg:p-8 shadow-md">
          
          {/* Header Stats Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAE0D0]">
            <div className="flex items-center gap-2 text-[#3D0D11] font-serif">
              <Layers className="w-5 h-5 text-[#8C1D24]" />
              <h3 className="text-base font-bold">
                {isBn 
                  ? `মোট ${filteredItems.length} টি সুবিধা কেন্দ্র প্রদর্শিত`
                  : `Showing ${filteredItems.length} medical & emergency facilities`}
              </h3>
              <span className="text-xs text-[#8C7A6B] font-mono">({activeZone === 'north' ? 'North Kolkata' : 'South Kolkata'})</span>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex lg:hidden bg-[#F2ECE1] p-1 rounded-xl">
              <button
                onClick={() => setMobileView('list')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-bold ${mobileView === 'list' ? 'bg-[#8C1D24] text-white' : 'text-[#6E5D52]'}`}
              >
                <ListIcon className="w-3.5 h-3.5 inline mr-1" />
                List
              </button>
              <button
                onClick={() => setMobileView('map')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-bold ${mobileView === 'map' ? 'bg-[#8C1D24] text-white' : 'text-[#6E5D52]'}`}
              >
                <MapIcon className="w-3.5 h-3.5 inline mr-1" />
                Map
              </button>
            </div>
          </div>

          {/* Split Container */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <Loader2 className="w-10 h-10 text-[#8C1D24] animate-spin" />
              <p className="text-xs font-serif text-[#6E5D52] italic">
                {isBn ? 'লাইভ ডাটা লোড হচ্ছে...' : 'Loading live backend data...'}
              </p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-serif max-w-xl mx-auto my-12">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
              
              {/* Left Column: Facility Cards List (7 Cols) */}
              <div className={`lg:col-span-6 xl:col-span-5 space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-16 text-[#8C7A6B]">
                    <p className="text-sm font-serif italic">
                      {isBn ? 'কোনো কেন্দ্র খুঁজে পাওয়া যায়নি।' : 'No facilities found matching your search.'}
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isHospital = item.type.includes('Hospital');
                    const isPolice = item.type.includes('Police');
                    const isAmbulance = item.type.includes('Ambulance');
                    const isSelected = selectedFacility?.title === item.title;

                    let iconBg = 'bg-purple-100 text-purple-700';
                    let iconEl = <Pill className="w-5 h-5" />;
                    let badgeStyle = 'bg-purple-50 text-purple-800 border-purple-200';

                    if (isHospital) {
                      iconBg = 'bg-rose-100 text-rose-700';
                      iconEl = <Hospital className="w-5 h-5" />;
                      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
                    } else if (isPolice) {
                      iconBg = 'bg-blue-100 text-blue-700';
                      iconEl = <Phone className="w-5 h-5" />;
                      badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
                    } else if (isAmbulance) {
                      iconBg = 'bg-emerald-100 text-emerald-700';
                      iconEl = <Hospital className="w-5 h-5" />;
                      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    }

                    return (
                      <div
                        key={idx}
                        ref={(el) => { cardRefs.current[item.title] = el; }}
                        onClick={() => setSelectedFacility(item)}
                        className={`bg-[#FAF6ED] p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#8C1D24] shadow-md ring-2 ring-[#8C1D24]/20'
                            : 'border-[#EAE0D0] hover:border-[#8C1D24]/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-2xl shrink-0 ${iconBg}`}>
                            {iconEl}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-[#3D0D11] text-base font-serif leading-snug group-hover:text-[#8C1D24] transition-colors truncate">
                                {item.title}
                              </h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-serif font-bold shrink-0 border ${badgeStyle}`}>
                                {item.type}
                              </span>
                            </div>

                            {item.subTitle && (
                              <p className="text-xs text-[#8C1D24] font-serif font-medium mb-1.5">
                                {item.subTitle}
                              </p>
                            )}

                            {item.address && (
                              <p className="text-xs text-[#6E5D52] font-serif flex items-start gap-1.5 mb-2 leading-relaxed">
                                <MapPin className="w-3.5 h-3.5 text-[#8C1D24] shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{item.address}</span>
                              </p>
                            )}

                            {item.phone && (
                              <p className="text-xs text-[#8C1D24] font-serif font-bold flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{item.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EAE0D0]/60 flex items-center justify-between">
                          <span className="text-[11px] text-[#8C7A6B] font-serif">
                            {isSelected ? '🎯 Selected on Map' : 'Click to view on Map'}
                          </span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-[#8C1D24] text-white hover:bg-[#6E161C] px-4 py-1.5 rounded-xl text-xs font-serif font-bold transition-all shadow-xs"
                          >
                            <span>GPS Directions</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: MapLibre Interactive Map (5 Cols) */}
              <div className={`lg:col-span-6 xl:col-span-7 h-[550px] lg:h-auto min-h-[450px] rounded-3xl overflow-hidden border border-[#EAE0D0] shadow-sm relative ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
                <MedicalMap
                  facilities={filteredItems}
                  selectedFacility={selectedFacility}
                  onSelectFacility={(fac) => setSelectedFacility(fac)}
                  activeZone={activeZone}
                />
              </div>

            </div>
          )}
        </div>

        {/* Emergency Call Banner - Matching Screenshot Bottom Strip */}
        <div className="bg-gradient-to-r from-[#FFF5F5] via-[#FDF2F2] to-[#FFF5F5] border border-[#FCA5A5]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold font-serif text-[#9F1239] mb-1">
                {isBn ? 'জরুরি পরিস্থিতিতে সহায়তা প্রয়োজন?' : 'Need Immediate Emergency Assistance?'}
              </h4>
              <p className="text-xs sm:text-sm text-[#881337] font-serif max-w-xl">
                {isBn 
                  ? 'তাত্ক্ষণিক মেডিকেল সহায়তার জন্য ১০২ (অ্যাম্বুলেন্স) বা পুলিশের জন্য ১০০ নম্বরে কল করুন।'
                  : 'For immediate medical emergencies call 102 (Ambulance) or 100 (Police Control Room).'}
              </p>
            </div>
          </div>

          <a
            href="tel:102"
            className="w-full sm:w-auto bg-[#8C1D24] hover:bg-[#6E161C] text-white px-8 py-3.5 rounded-2xl font-serif font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>{isBn ? 'অ্যাম্বুলেন্স কল করুন ১০২' : 'Call Ambulance 102'} →</span>
          </a>
        </div>

      </div>
    </section>
  );
};

export default MedicalFacilitiesSection;
