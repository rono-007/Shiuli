import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, MapPin, ExternalLink, RefreshCw, Layers, LayoutGrid, Map, ArrowUp, Utensils, ChevronDown, Fuel, CreditCard, Hospital, Bath, Star, AlertCircle } from 'lucide-react';
import PandalMap from './PandalMap';
import fallbackData from '../data/north_cords.json';
import { getNearestEateriesWithFallback } from '../utils/nearbyEateries';

interface Pandal {
  name: string;
  api_name: string;
  address: string;
  lat: number;
  lon: number;
  status: string;
}

interface NorthCalcuttaSectionProps {
  onBack: () => void;
}

const NorthCalcuttaSection: React.FC<NorthCalcuttaSectionProps> = ({ onBack }) => {
  const [pandals, setPandals] = useState<Pandal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [selectedPandalName, setSelectedPandalName] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'fastapi' | 'fallback' | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [expandedFacilitiesIdx, setExpandedFacilitiesIdx] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    setErrorInfo(null);

    const CACHE_KEY = 'pujopath_north_pandals_cache';
    const CACHE_TIME_KEY = 'pujopath_north_pandals_cache_time';
    const ONE_HOUR_MS = 60 * 60 * 1000;

    // Check localStorage cache first
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      
      if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime, 10)) < ONE_HOUR_MS) {
        setPandals(JSON.parse(cachedData));
        setDataSource('fastapi');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Failed to read from localStorage cache:', err);
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';
    try {
      const response = await fetch(`${baseUrl}/api/pandals/north`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPandals(data);
      setDataSource('fastapi');

      // Save to localStorage cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } catch (err) {
        console.warn('Failed to save to localStorage cache:', err);
      }
    } catch (e: any) {
      console.warn('FastAPI backend not reachable, using local fallback:', e);
      setPandals(fallbackData as Pandal[]);
      setDataSource('fallback');
      setErrorInfo('ব্যাকএন্ড সার্ভার অফলাইন, লোকাল ডাটা ব্যবহৃত হচ্ছে');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const filteredPandals = pandals.filter(pandal => {
    const q = searchQuery.toLowerCase();
    return (
      pandal.name.toLowerCase().includes(q) ||
      pandal.address.toLowerCase().includes(q) ||
      (pandal.api_name && pandal.api_name.toLowerCase().includes(q))
    );
  });

  return (
    <section className="min-h-screen bg-paper text-ink pt-32 pb-24 px-6 md:px-12 relative">
      {/* Heavy Noise Overlay for Vintage Print Feel */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.05] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 border-b border-ink/10 pb-8">
          <div className="space-y-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 group text-xs font-mono uppercase tracking-widest text-bengali-red hover:text-ink transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>ফিরে যান</span>
            </button>
            
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-ink/40">III • পরিক্রমা সূচী</span>
              <h2 className="text-4xl md:text-5xl font-serif text-ink italic font-normal tracking-wide">
                উত্তর কলকাতার মণ্ডপসমূহ
              </h2>
              <p className="text-xs font-sans text-ink/60 max-w-lg leading-relaxed">
                ঐতিহ্যবাহী বাগবাজার থেকে শ্যামবাজার ও শোভাবাজারের শতাব্দীপ্রাচীন দুর্গাপুজো এবং তাদের সঠিক কাস্টম মানচিত্র নির্দেশিকা।
              </p>
            </div>
          </div>

          {/* Source Indicator / Refresh */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono tracking-wider uppercase text-ink/40">উৎস:</span>
              {loading ? (
                <span className="h-2 w-2 rounded-full bg-lamp animate-pulse"></span>
              ) : dataSource === 'fastapi' ? (
                <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-2 py-0.5 border border-emerald-500/20 text-[9px] font-mono rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  FastAPI backend (সচল)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-[#8B1E2D]/5 text-bengali-red px-2 py-0.5 border border-bengali-red/20 text-[9px] font-mono rounded-full" title={errorInfo || ''}>
                  <span className="h-1.5 w-1.5 rounded-full bg-bengali-red animate-pulse"></span>
                  লোকাল ডাটা (অফলাইন)
                </span>
              )}
            </div>

            <button 
              onClick={fetchData} 
              disabled={loading}
              className="flex items-center gap-2 bg-night text-[#FAF6ED] px-4 py-2 hover:bg-night/90 text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="bg-[#FAF6ED] border border-ink/10 p-6 md:p-8 rounded-3xl mb-12 flex flex-col md:flex-row gap-6 justify-between items-center shadow-sm">
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-ink/70">
            <Layers className="w-5 h-5 text-bengali-red/60" />
            <div className="text-left font-serif">
              <span className="text-xl font-bold text-ink">{filteredPandals.length}</span> / {pandals.length} মণ্ডপ প্রদর্শিত
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex bg-ink/5 p-1 rounded-full border border-ink/10">
            <button
              onClick={() => { setViewMode('cards'); setSelectedPandalName(null); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-night text-[#FAF6ED] shadow-sm'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>তালিকা (Cards)</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-night text-[#FAF6ED] shadow-sm'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>মানচিত্র (Map)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-md group">
            <div className="absolute inset-0 bg-night/5 rounded-full pointer-events-none border border-ink/5 transition-all duration-300 group-focus-within:border-bengali-red/30"></div>
            <div className="relative flex items-center px-4 py-2">
              <Search className="w-4 h-4 text-ink/40 mr-2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="মণ্ডপের নাম বা ঠিকানা খুঁজুন..."
                className="w-full bg-transparent text-sm font-sans placeholder-ink/40 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-ink/40 hover:text-bengali-red text-sm font-bold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading Spinner / Map View / Pandal Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-10 h-10 border-4 border-bengali-red/20 border-t-bengali-red rounded-full animate-spin"></div>
            <p className="text-xs font-sans text-ink/50 italic">লোড হচ্ছে...</p>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive MapLibre GL Map View */
          <div className="w-full h-[85vh] md:h-[calc(100vh-280px)] min-h-[600px] bg-[#FAF6ED] border border-ink/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg relative animate-fade-in-slow">
            <PandalMap
              pandals={filteredPandals}
              selectedPandalName={selectedPandalName}
              searchQuery={debouncedQuery}
            />
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="absolute bottom-6 right-6 md:hidden bg-[#8B1E2D] hover:bg-[#8B1E2D]/90 text-[#FAF6ED] px-4 py-2.5 rounded-full shadow-xl border border-[#D4A24C]/35 flex items-center gap-1.5 active:scale-95 transition-all z-20 font-sans text-xs font-bold"
              title="Go to Top"
            >
              <ArrowUp className="w-4 h-4" />
              <span>উপরে যান (Top)</span>
            </button>
          </div>
        ) : filteredPandals.length > 0 ? (
          /* Postage Stamp Album & Facilities Dropdown Layout */
          <div className="bg-[#F5EFE6] p-6 md:p-8 rounded-3xl border border-ink/10 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPandals.map((pandal, idx) => {
                const { within1km, relativelyFar } = getNearestEateriesWithFallback(pandal.lat, pandal.lon, 6);
                const isExpanded = expandedFacilitiesIdx === idx;
                const totalDisplayCount = within1km.length > 0 ? within1km.length : relativelyFar.length;

                return (
                  <div 
                    key={idx}
                    className="bg-paper border border-ink/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Stamp Top Row & Denomination */}
                      <div className="flex justify-between items-center border-b border-ink/10 pb-2 mb-3">
                        <span className="text-xs font-mono font-bold text-bengali-red tracking-wider">
                          NC{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPandalName(pandal.name);
                              setViewMode('map');
                            }}
                            className="text-xs font-serif font-bold text-ink/70 hover:text-bengali-red flex items-center gap-1 bg-ink/5 hover:bg-ink/10 px-2 py-1 rounded transition-colors"
                            title="মানচিত্রে রুট দেখুন"
                          >
                            <MapPin className="w-3 h-3 text-bengali-red" />
                            <span>মানচিত্রে দেখুন</span>
                          </button>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pandal.lat},${pandal.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink/40 hover:text-bengali-red p-1 transition-colors"
                            title="Google Maps GPS"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Pandal Title & Address */}
                      <h3 className="text-base font-serif font-bold text-ink leading-snug group-hover:text-bengali-red transition-colors">
                        {pandal.name}
                      </h3>
                      <p className="text-xs font-sans text-ink/60 mt-1 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-bengali-red flex-shrink-0 mt-0.5" />
                        <span>{pandal.address}</span>
                      </p>

                      {/* NEARBY FACILITIES DROPDOWN ACCORDION BUTTON */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedFacilitiesIdx(isExpanded ? null : idx);
                        }}
                        className="w-full mt-4 flex items-center justify-between bg-[#FAF6ED] hover:bg-amber-500/10 text-amber-900 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-serif font-bold transition-all shadow-sm"
                      >
                        <span className="flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-bengali-red" />
                          <span>কাছাকাছি সুযোগ-সুবিধা (Nearby Facilities)</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${within1km.length > 0 ? 'bg-amber-600/20 text-amber-950' : 'bg-red-500/10 text-red-900'}`}>
                            {within1km.length > 0 ? `${within1km.length} টি (≤১km)` : `দূরবর্তী ${totalDisplayCount} টি`}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-amber-800 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {/* EXPANDED NEARBY FACILITIES PANEL */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-[#FAF6ED] border border-amber-500/20 rounded-xl space-y-3 animate-fade-in text-xs font-sans">
                          
                          {/* REAL DATA: Restaurants & Cafes */}
                          <div>
                            <div className="text-[11px] font-serif font-bold text-bengali-red mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Utensils className="w-3 h-3" />
                                <span>রেস্তোরাঁ ও ক্যাফে:</span>
                              </span>
                              <span className="text-[9px] font-mono text-ink/40">
                                {within1km.length > 0 ? '১ কিমি ব্যাসার্ধের মধ্যে' : '১ কিমি এর বাইরে'}
                              </span>
                            </div>

                            {within1km.length > 0 ? (
                              /* Eateries Within 1 km */
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {within1km.map((eatery, eIdx) => (
                                  <div 
                                    key={eIdx}
                                    className="bg-paper p-2 rounded-lg border border-ink/5 flex items-center justify-between gap-2 hover:border-bengali-red/30 transition-colors"
                                  >
                                    <div className="truncate">
                                      <div className="font-serif font-bold text-ink text-[11px] truncate flex items-center gap-1">
                                        <span>{eatery.title}</span>
                                        {eatery.subTitle && <span className="text-bengali-red font-serif text-[10px]">({eatery.subTitle})</span>}
                                      </div>
                                      <div className="text-[10px] font-sans text-ink/50 flex items-center gap-2 mt-0.5">
                                        <span>{eatery.categoryName || 'Restaurant'}</span>
                                        {eatery.totalScore && (
                                          <span className="flex items-center text-amber-700 font-mono font-bold">
                                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                                            {eatery.totalScore.toFixed(1)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0">
                                      <span className="bg-emerald-500/10 text-emerald-900 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                        {eatery.distanceMeters}m
                                      </span>
                                      <a
                                        href={eatery.url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-bengali-red hover:underline font-bold mt-1"
                                      >
                                        Maps ↗
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Fallback: No Eateries Within 1km, Show Relatively Far Eateries */
                              <div className="space-y-2">
                                <div className="flex items-start gap-1.5 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-900 text-[11px] font-serif">
                                  <AlertCircle className="w-3.5 h-3.5 text-bengali-red flex-shrink-0 mt-0.5" />
                                  <span>১ কিলোমিটারের মধ্যে কোনো ক্যাফে বা রেস্তোরাঁ পাওয়া যায়নি।</span>
                                </div>

                                <div className="text-[10px] font-serif font-bold text-ink/70 italic">
                                  কিছুটা দূরে অবস্থিত রেস্তোরাঁ ও ক্যাফে (Relatively Far Eateries):
                                </div>

                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {relativelyFar.map((eatery, eIdx) => (
                                    <div 
                                      key={eIdx}
                                      className="bg-paper p-2 rounded-lg border border-amber-500/20 flex items-center justify-between gap-2 hover:border-bengali-red/30 transition-colors"
                                    >
                                      <div className="truncate">
                                        <div className="font-serif font-bold text-ink text-[11px] truncate flex items-center gap-1">
                                          <span>{eatery.title}</span>
                                          {eatery.subTitle && <span className="text-bengali-red font-serif text-[10px]">({eatery.subTitle})</span>}
                                        </div>
                                        <div className="text-[10px] font-sans text-ink/50 flex items-center gap-2 mt-0.5">
                                          <span>{eatery.categoryName || 'Restaurant'}</span>
                                          {eatery.totalScore && (
                                            <span className="flex items-center text-amber-700 font-mono font-bold">
                                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                                              {eatery.totalScore.toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end flex-shrink-0">
                                        <span className="bg-amber-500/10 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                          {(eatery.distanceMeters / 1000).toFixed(1)} km
                                        </span>
                                        <a
                                          href={eatery.url || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[10px] text-bengali-red hover:underline font-bold mt-1"
                                        >
                                          Maps ↗
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* PLACEHOLDERS: Other Important Facilities */}
                          <div className="border-t border-ink/10 pt-2 space-y-1.5">
                            <div className="text-[10px] font-serif font-bold text-ink/60 uppercase tracking-wider mb-1">
                              অন্যান্য জরুরি সুবিধা (Placeholders):
                            </div>

                            {/* Petrol Pump Placeholder */}
                            <div className="flex items-center justify-between text-[11px] bg-paper p-1.5 rounded border border-ink/5 text-ink/70">
                              <span className="flex items-center gap-1.5">
                                <Fuel className="w-3.5 h-3.5 text-amber-700" />
                                <span className="font-serif">পেট্রোল পাম্প (Petrol Pump)</span>
                              </span>
                              <span className="text-[9px] font-mono bg-ink/5 px-1.5 py-0.5 rounded text-ink/50">
                                ~৪৫০m
                              </span>
                            </div>

                            {/* ATM Placeholder */}
                            <div className="flex items-center justify-between text-[11px] bg-paper p-1.5 rounded border border-ink/5 text-ink/70">
                              <span className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                                <span className="font-serif">এটিএম বুথ (ATM / Banking)</span>
                              </span>
                              <span className="text-[9px] font-mono bg-ink/5 px-1.5 py-0.5 rounded text-ink/50">
                                ~২০০m
                              </span>
                            </div>

                            {/* Hospital / First Aid Placeholder */}
                            <div className="flex items-center justify-between text-[11px] bg-paper p-1.5 rounded border border-ink/5 text-ink/70">
                              <span className="flex items-center gap-1.5">
                                <Hospital className="w-3.5 h-3.5 text-bengali-red" />
                                <span className="font-serif">প্রাথমিক চিকিৎসা বুথ (First Aid)</span>
                              </span>
                              <span className="text-[9px] font-mono bg-ink/5 px-1.5 py-0.5 rounded text-ink/50">
                                ~৩০০m
                              </span>
                            </div>

                            {/* Public Toilet Placeholder */}
                            <div className="flex items-center justify-between text-[11px] bg-paper p-1.5 rounded border border-ink/5 text-ink/70">
                              <span className="flex items-center gap-1.5">
                                <Bath className="w-3.5 h-3.5 text-sky-700" />
                                <span className="font-serif">পাবলিক শৌচালয় (Public Washroom)</span>
                              </span>
                              <span className="text-[9px] font-mono bg-ink/5 px-1.5 py-0.5 rounded text-ink/50">
                                ~১৫০m
                              </span>
                            </div>

                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-24 bg-[#FAF6ED] border border-ink/10 max-w-xl mx-auto rounded-3xl">
            <p className="text-base font-serif italic text-ink/50">
              কোনো মণ্ডপ খুঁজে পাওয়া যায়নি।
            </p>
            <p className="text-xs font-sans text-ink/40 mt-1">
              অন্য কোনো মণ্ডপ বা ঠিকানা দিয়ে অনুসন্ধান করার চেষ্টা করুন।
            </p>
            <button 
              onClick={() => setSearchQuery('')} 
              className="mt-4 text-xs font-sans text-bengali-red underline hover:text-ink transition-colors font-semibold"
            >
              অনুসন্ধান মুছুন
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

export default NorthCalcuttaSection;
