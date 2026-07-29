import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, MapPin, ExternalLink, RefreshCw, Layers, LayoutGrid, Map, Utensils, Fuel, CreditCard, Hospital, Bath, Star, AlertCircle, X, Navigation, Pill } from 'lucide-react';
import PandalMap from './PandalMap';
import fallbackData from '../data/north_cords.json';
import { getNearestEateriesWithFallback } from '../utils/nearbyEateries';
import { getNearestFacilities } from '../utils/nearbyFacilities';

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
  const [expandedPandalIdx, setExpandedPandalIdx] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to detail panel when expanded
  useEffect(() => {
    if (expandedPandalIdx !== null && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [expandedPandalIdx]);

  const filteredPandals = pandals.filter(pandal => {
    const q = searchQuery.toLowerCase();
    return (
      pandal.name.toLowerCase().includes(q) ||
      pandal.address.toLowerCase().includes(q) ||
      (pandal.api_name && pandal.api_name.toLowerCase().includes(q))
    );
  });

  // Detail panel for a specific pandal
  const renderDetailPanel = (pandal: Pandal, idx: number) => {
    const { within1km, relativelyFar } = getNearestEateriesWithFallback(pandal.lat, pandal.lon, 6);
    const facilities = getNearestFacilities(pandal.lat, pandal.lon);
    const hasEateries = within1km.length > 0;
    const eateriesToShow = hasEateries ? within1km : relativelyFar;

    return (
      <div
        ref={detailRef}
        className="col-span-full bg-gradient-to-br from-[#FAF6ED] via-paper to-[#F5EFE6] border-2 border-bengali-red/20 rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
        style={{ animationDuration: '0.3s' }}
      >
        {/* Close Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-bengali-red to-[#a02535] px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-white/70 tracking-widest">
              NC{String(idx + 1).padStart(2, '0')}
            </span>
            <span className="w-px h-4 bg-white/30"></span>
            <span className="text-sm font-serif font-bold text-white truncate max-w-[250px] md:max-w-none">
              {pandal.name}
            </span>
          </div>
          <button
            onClick={() => setExpandedPandalIdx(null)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">বন্ধ করুন</span>
          </button>
        </div>

        {/* Content: Two Column Layout */}
        <div className="flex flex-col lg:flex-row">
          
          {/* LEFT: Pandal Info + Map Link */}
          <div className="w-full lg:w-2/5 p-6 lg:p-8 border-r border-ink/10 flex flex-col gap-5">

            {/* Pandal Name */}
            <div>
              <h3 className="text-2xl lg:text-3xl font-serif font-bold text-ink leading-tight">
                {pandal.name}
              </h3>
              {pandal.api_name && pandal.api_name !== pandal.name && (
                <p className="text-sm font-sans text-ink/50 mt-1 italic">{pandal.api_name}</p>
              )}
            </div>

            {/* Address Card */}
            <div className="flex items-start gap-3 bg-bengali-red/5 p-4 rounded-2xl border border-bengali-red/15">
              <MapPin className="w-5 h-5 text-bengali-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-sans text-ink/80 leading-relaxed">{pandal.address}</p>
                <p className="text-[10px] font-mono text-ink/40 mt-1">
                  GPS: {pandal.lat.toFixed(4)}°N, {pandal.lon.toFixed(4)}°E
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${pandal.lat},${pandal.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-night text-paper py-3 rounded-xl text-xs font-sans font-bold hover:bg-night/90 transition-colors shadow-md"
              >
                <Navigation className="w-4 h-4" />
                <span>Google Maps</span>
              </a>
              <button
                onClick={() => {
                  setSelectedPandalName(pandal.name);
                  setViewMode('map');
                  setExpandedPandalIdx(null);
                }}
                className="flex items-center justify-center gap-2 bg-bengali-red text-white py-3 rounded-xl text-xs font-sans font-bold hover:bg-bengali-red/90 transition-colors shadow-md"
              >
                <Map className="w-4 h-4" />
                <span>মানচিত্রে দেখুন</span>
              </button>
            </div>

            {/* Facility Cards */}
            <div className="space-y-2 mt-2">
              <h4 className="text-[11px] font-serif font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                জরুরি সুবিধাসমূহ (Real Nearby Facilities)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {/* Petrol Pump */}
                <a
                  href={facilities.petrolPump?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2.5 rounded-xl border border-ink/5 hover:border-amber-600/30 text-[11px] text-ink/70 transition-all group"
                >
                  <Fuel className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-amber-700 truncate">
                      {facilities.petrolPump?.title || 'পেট্রোল পাম্প'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50">
                      {facilities.petrolPump ? `${facilities.petrolPump.distanceMeters}m` : '~৪৫০m'}
                    </div>
                  </div>
                </a>

                {/* ATM */}
                <a
                  href={facilities.atm?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2.5 rounded-xl border border-ink/5 hover:border-emerald-600/30 text-[11px] text-ink/70 transition-all group"
                >
                  <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-emerald-700 truncate">
                      {facilities.atm?.title || 'এটিএম বুথ'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50">
                      {facilities.atm ? `${facilities.atm.distanceMeters}m` : '~২০০m'}
                    </div>
                  </div>
                </a>

                {/* Hospital */}
                <a
                  href={facilities.hospital?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2.5 rounded-xl border border-ink/5 hover:border-bengali-red/30 text-[11px] text-ink/70 transition-all group"
                >
                  <Hospital className="w-4 h-4 text-bengali-red flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-bengali-red truncate">
                      {facilities.hospital?.title || 'হাসপাতাল / নার্সিং হোম'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50">
                      {facilities.hospital ? `${facilities.hospital.distanceMeters}m` : '~৩০০m'}
                    </div>
                  </div>
                </a>

                {/* Pharmacy */}
                <a
                  href={facilities.pharmacy?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2.5 rounded-xl border border-ink/5 hover:border-purple-600/30 text-[11px] text-ink/70 transition-all group"
                >
                  <Pill className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-purple-700 truncate">
                      {facilities.pharmacy?.title || 'ফার্মেসি / ওষুধের দোকান'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50">
                      {facilities.pharmacy ? `${facilities.pharmacy.distanceMeters}m` : '~২৫০m'}
                    </div>
                  </div>
                </a>

                {/* Public Toilet */}
                <a
                  href={facilities.toilet?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2.5 rounded-xl border border-ink/5 hover:border-sky-600/30 text-[11px] text-ink/70 transition-all group col-span-2"
                >
                  <Bath className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-sky-700 truncate">
                      {facilities.toilet?.title || 'পাবলিক শৌচালয়'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50">
                      {facilities.toilet ? `${facilities.toilet.distanceMeters}m` : '~১৫০m'}
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Nearby Eateries */}
          <div className="w-full lg:w-3/5 p-6 lg:p-8 bg-gradient-to-b from-[#FAF6ED] to-paper">
            
            {/* Eateries Header */}
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-serif font-bold text-ink flex items-center gap-2">
                <span className="bg-bengali-red text-white w-7 h-7 rounded-full flex items-center justify-center">
                  <Utensils className="w-3.5 h-3.5" />
                </span>
                কাছাকাছি রেস্তোরাঁ ও ক্যাফে
              </h4>
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                hasEateries 
                  ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
              }`}>
                {hasEateries ? `${within1km.length} টি (≤১ km)` : `দূরবর্তী ${relativelyFar.length} টি`}
              </span>
            </div>

            {/* Warning if no eateries within 1km */}
            {!hasEateries && (
              <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/5 border border-red-500/15 rounded-xl text-red-900 text-xs font-serif">
                <AlertCircle className="w-4 h-4 text-bengali-red flex-shrink-0 mt-0.5" />
                <span>১ কিলোমিটারের মধ্যে কোনো ক্যাফে বা রেস্তোরাঁ পাওয়া যায়নি। কিছুটা দূরের তালিকা দেখানো হচ্ছে।</span>
              </div>
            )}

            {/* Eateries Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {eateriesToShow.map((eatery, eIdx) => (
                <div 
                  key={eIdx}
                  className="bg-paper p-4 rounded-2xl border border-ink/8 hover:border-bengali-red/30 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-serif font-bold text-ink group-hover:text-bengali-red transition-colors leading-snug">
                        {eatery.title}
                      </h5>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        hasEateries
                          ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                      }`}>
                        {hasEateries ? `${eatery.distanceMeters}m` : `${(eatery.distanceMeters / 1000).toFixed(1)}km`}
                      </span>
                    </div>
                    {eatery.subTitle && (
                      <p className="text-[10px] text-bengali-red font-serif mt-0.5">({eatery.subTitle})</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-ink/50 font-sans">
                      <span className="bg-ink/5 px-2 py-0.5 rounded-full">{eatery.categoryName || 'Restaurant'}</span>
                      {eatery.totalScore && (
                        <span className="flex items-center gap-0.5 text-amber-700 font-mono font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {eatery.totalScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={eatery.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 bg-ink/5 hover:bg-bengali-red hover:text-white text-ink/70 py-2 rounded-xl text-[11px] font-sans font-bold transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Google Maps GPS ({eatery.lat.toFixed(4)}, {eatery.lng.toFixed(4)}) ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          <div className="w-full h-auto sm:h-[80vh] md:h-[calc(100vh-280px)] min-h-[450px] sm:min-h-[550px] md:min-h-[600px] bg-transparent sm:bg-[#FAF6ED] sm:border border-ink/10 rounded-2xl md:rounded-3xl overflow-visible sm:overflow-hidden sm:shadow-lg relative animate-fade-in-slow">
            <PandalMap
              pandals={filteredPandals}
              selectedPandalName={selectedPandalName}
              searchQuery={debouncedQuery}
            />
          </div>
        ) : filteredPandals.length > 0 ? (
          /* Pandal Cards Grid with Expandable Detail Panel */
          <div className="bg-[#F5EFE6] p-6 md:p-8 rounded-3xl border border-ink/10 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPandals.map((pandal, idx) => {
                const isExpanded = expandedPandalIdx === idx;

                return (
                  <React.Fragment key={idx}>
                    {/* Compact Pandal Card */}
                    <div 
                      onClick={() => setExpandedPandalIdx(isExpanded ? null : idx)}
                      className={`bg-paper border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden ${
                        isExpanded 
                          ? 'border-bengali-red/40 ring-2 ring-bengali-red/20 shadow-lg' 
                          : 'border-ink/10 hover:border-bengali-red/20'
                      }`}
                    >
                      {/* Accent top bar when selected */}
                      {isExpanded && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bengali-red to-[#E5B05C]"></div>
                      )}

                      {/* Stamp Top Row */}
                      <div className="flex justify-between items-center border-b border-ink/10 pb-2 mb-3">
                        <span className="text-xs font-mono font-bold text-bengali-red tracking-wider">
                          NC{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pandal.lat},${pandal.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink/40 hover:text-bengali-red p-1 transition-colors"
                            title="Google Maps GPS"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {isExpanded ? (
                            <span className="text-[9px] font-mono text-bengali-red font-bold bg-bengali-red/10 px-2 py-0.5 rounded-full">
                              বিস্তারিত ↓
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-ink/40 group-hover:text-bengali-red transition-colors">
                              ক্লিক করুন →
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pandal Title & Address */}
                      <h3 className={`text-base font-serif font-bold leading-snug transition-colors ${
                        isExpanded ? 'text-bengali-red' : 'text-ink group-hover:text-bengali-red'
                      }`}>
                        {pandal.name}
                      </h3>
                      <p className="text-xs font-sans text-ink/60 mt-1 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-bengali-red flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{pandal.address}</span>
                      </p>
                    </div>

                    {/* Expanded Detail Panel - rendered right after the card */}
                    {isExpanded && renderDetailPanel(pandal, idx)}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-24 bg-[#FAF6ED] border border-ink/10 max-w-xl mx-auto rounded-3xl">
            <p className="text-base font-serif italic text-ink/50">
              কোনো মণ্ডপ খুঁজে পাওয়া যায়নি।
            </p>
            <p className="text-xs font-sans text-ink/40 mt-1">
              অন্য কোনো মণ্ডপ বা ঠিকানা দিয়ে অনুসন্ধান করার চেষ্টা করুন।
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
