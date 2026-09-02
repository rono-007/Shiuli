import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Search, MapPin, ExternalLink, RefreshCw, Layers, LayoutGrid, Map, ArrowUp } from 'lucide-react';
const PandalMap = React.lazy(() => import('./PandalMap'));
import { getNearestMetro } from '../utils/nearbyFacilities';
import { secureGetItem, secureSetItem } from '../utils/storage';


interface Pandal {
  name: string;
  api_name: string;
  address: string;
  lat: number;
  lon: number;
  status: string;
}

interface BonediCalcuttaSectionProps {
  onBack: () => void;
}

const BonediCalcuttaSection: React.FC<BonediCalcuttaSectionProps> = ({ onBack }) => {
  const getInitialPandals = () => {
    try {
      const cachedData = secureGetItem<Pandal[]>('pujopath_bonedi_pandals_cache');
      if (Array.isArray(cachedData) && cachedData.length > 0 && cachedData[0].name) {
        return cachedData;
      }
    } catch (e) {}
    return [];
  };

  const [pandals, setPandals] = useState<Pandal[]>(getInitialPandals);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [selectedPandalName, setSelectedPandalName] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Reset pagination when search query changes
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = async () => {
    if (pandals.length === 0) setLoading(true);

    const CACHE_KEY = 'pujopath_bonedi_pandals_cache';
    const CACHE_TIME_KEY = 'pujopath_bonedi_pandals_cache_time';
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedTime && (Date.now() - parseInt(cachedTime, 10)) < ONE_HOUR_MS) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/data/bonedi_pandals.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].name) {
          setPandals(data);
          try {
            secureSetItem(CACHE_KEY, data);
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
          } catch (err) {}
          return;
        }
      }
    } catch (e: any) {
      console.warn('Static data fetch failed, using bundled fallback');
    } finally {
      setLoading(false);
    }

    // If fetch failed or returned empty, ensure it doesn't crash
    if (pandals.length === 0) {
        setPandals([]);
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
              <h1 className="text-4xl md:text-5xl font-serif text-ink italic font-normal tracking-wide">
                ঐতিহ্যবাহী বনেদি কলকাতার পুজো ও ঠাকুরদালান গাইড
              </h1>
              <p className="text-xs font-sans text-ink/60 max-w-lg leading-relaxed">
                শোভাবাজার রাজবাড়ি, ছাতুবাবু লাহাবাড়ি ও দর্জিপাড়া মিত্রবাড়ি সহ কলকাতার শতাব্দীপ্রাচীন পারিবারিক ঐতিহ্যবাহী বনেদি পুজো নির্দেশিকা।
              </p>
            </div>
          </div>

          {/* Source Indicator / Refresh */}
          <div className="flex flex-col items-start md:items-end gap-3">
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

        {/* Loading Skeleton / Map View / Pandal Cards Grid */}
        {loading ? (
          <div className="bg-[#F5EFE6] p-6 md:p-10 rounded-3xl border border-ink/10 shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {[...Array(12)].map((_, idx) => (
                <div key={idx} className="bg-paper p-1.5 shadow-sm animate-pulse">
                  <div className="p-3 border-[3px] border-dotted border-ink/10 h-full aspect-square flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="h-3 bg-ink/10 rounded w-8"></div>
                      <div className="h-3 bg-ink/10 rounded w-4"></div>
                    </div>
                    <div className="h-4 bg-ink/20 rounded w-full my-2"></div>
                    <div className="h-2 bg-ink/5 rounded w-16 mx-auto mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive MapLibre GL Map View */
          <div className="w-full h-[85vh] md:h-[calc(100vh-280px)] min-h-[600px] bg-[#FAF6ED] border border-ink/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg relative animate-fade-in-slow">
            <Suspense fallback={
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-bengali-red/20 border-t-bengali-red rounded-full animate-spin"></div>
                <p className="text-xs font-sans text-ink/50 mt-4">মানচিত্র লোড হচ্ছে...</p>
              </div>
            }>
              <PandalMap
                pandals={filteredPandals}
                selectedPandalName={selectedPandalName}
                searchQuery={debouncedQuery}
              />
            </Suspense>
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
          /* Postage Stamp Album Layout */
          <div className="bg-[#F5EFE6] p-6 md:p-10 rounded-3xl border border-ink/10 shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-20">
              {filteredPandals.slice(0, visibleCount).map((pandal, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setSelectedPandalName(pandal.name);
                    setViewMode('map');
                  }}
                  className="bg-paper p-1.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                  title={`${pandal.name}\n${pandal.address}\n(মানচিত্রে রুট দেখতে ক্লিক করুন)`}
                >
                  {/* The Inner Stamp Edge */}
                  <div 
                    className="p-3 border-[3px] border-dotted border-[#D4A24C]/40 h-full aspect-square flex flex-col justify-between relative overflow-hidden bg-cover bg-center bg-no-repeat rounded-lg"
                    style={{ 
                      backgroundImage: "url('/pandal-card.webp')",
                      backgroundSize: '100% 100%'
                    }}
                  >
                    
                    {/* Faded Background Postmark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-bengali-red/5 rounded-full flex items-center justify-center rotate-12 pointer-events-none">
                      <div className="w-20 h-20 border border-bengali-red/5 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-serif text-bengali-red/5">BN</span>
                      </div>
                    </div>

                    {/* Top Row: Denomination & Icon */}
                    <div className="flex justify-between items-start relative z-10">
                      <span className="text-[10px] font-mono font-bold text-ink/60 tracking-wider">
                        BN{String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${pandal.lat},${pandal.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-ink/20 hover:text-bengali-red p-0.5 transition-colors"
                          title="Google Maps এ দেখুন"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <MapPin className="w-3.5 h-3.5 text-ink/20 group-hover:text-bengali-red transition-colors duration-300" />
                      </div>
                    </div>
                    
                    {/* Center: Pandal Name */}
                    <div className="flex-1 flex items-center justify-center relative z-10 my-2">
                      <h3 className="text-sm font-serif text-ink text-center leading-snug line-clamp-3 group-hover:text-bengali-red transition-colors">
                        {pandal.name}
                      </h3>
                    </div>

                    {/* Bottom Row: Nearest Metro & Distance */}
                    {(() => {
                      const nearestMetro = getNearestMetro(pandal.lat, pandal.lon);
                      return (
                        <div className="text-[8px] font-sans text-ink/70 text-center uppercase tracking-tight border-t border-ink/10 pt-1.5 relative z-10 truncate flex items-center justify-center gap-1">
                          <span className="text-bengali-red font-bold">🚇 {nearestMetro ? nearestMetro.title : 'METRO'}</span>
                          {nearestMetro && <span className="font-mono text-bengali-red/80 font-bold">• {nearestMetro.distanceText}</span>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredPandals.length && (
              <div className="flex justify-center -mt-10 mb-6">
                <button
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="bg-[#3D0D11]/5 hover:bg-[#3D0D11]/10 text-[#3D0D11] border border-[#3D0D11]/10 px-6 py-2.5 rounded-full font-serif font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  আরও দেখুন
                </button>
              </div>
            )}
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

export default BonediCalcuttaSection;
