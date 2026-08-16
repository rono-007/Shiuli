import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, MapPin, ExternalLink, Star, Phone, Clock, Loader2 } from 'lucide-react';

interface EateryLocation {
  lat: number;
  lng: number;
}

interface OpeningHour {
  day: string;
  hours: string;
}

interface Eatery {
  title: string;
  subTitle?: string | null;
  description?: string | null;
  price?: string | null;
  categoryName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  website?: string | null;
  location?: EateryLocation | null;
  totalScore?: number | null;
  reviewsCount?: number | null;
  imageUrl?: string | null;
  url?: string | null;
  openingHours?: OpeningHour[] | null;
  permanentlyClosed?: boolean;
  zone?: 'north' | 'south';
}

interface FacilitiesSectionProps {
  onBack?: () => void;
}

const CATEGORY_TAGS = [
  'All',
  'Bengali restaurant',
  'Biryani restaurant',
  'Fast food restaurant',
  'Coffee shop',
  'Bakery',
  'North Indian restaurant',
  'Chinese restaurant',
  'Sweet shop'
];

// Module-level in-memory cache to guarantee 0ms instant reload
let cachedNorthEateries: Eatery[] | null = null;
let cachedSouthEateries: Eatery[] | null = null;
let loadPromise: Promise<{ north: Eatery[]; south: Eatery[] }> | null = null;

function loadEateriesDatasets() {
  if (cachedNorthEateries && cachedSouthEateries) {
    return Promise.resolve({ north: cachedNorthEateries, south: cachedSouthEateries });
  }
  if (!loadPromise) {
    loadPromise = Promise.all([
      import('../data/north_eateries.json').then(m =>
        (((m.default || m) as unknown) as Eatery[]).map(x => ({ ...x, zone: 'north' as const }))
      ).catch(() => []),
      import('../data/south_eateries.json').then(m =>
        (((m.default || m) as unknown) as Eatery[]).map(x => ({ ...x, zone: 'south' as const }))
      ).catch(() => [])
    ]).then(([north, south]) => {
      cachedNorthEateries = north;
      cachedSouthEateries = south;
      return { north, south };
    });
  }
  return loadPromise;
}

// Immediately trigger background prefetch when module is loaded
loadEateriesDatasets().catch(() => {});

const FacilitiesSection: React.FC<FacilitiesSectionProps> = ({ onBack }) => {
  const [data, setData] = useState<{ north: Eatery[]; south: Eatery[] }>({
    north: cachedNorthEateries || [],
    south: cachedSouthEateries || []
  });
  const [loading, setLoading] = useState<boolean>(!cachedNorthEateries || !cachedSouthEateries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<'all' | 'north' | 'south'>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(32);

  useEffect(() => {
    if (!cachedNorthEateries || !cachedSouthEateries) {
      setLoading(true);
      loadEateriesDatasets().then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, []);

  // Reset pagination limit when filters change
  useEffect(() => {
    setDisplayLimit(32);
  }, [searchQuery, selectedCategory, minRating, selectedZone]);

  const eateriesList = useMemo(() => {
    if (selectedZone === 'north') return data.north;
    if (selectedZone === 'south') return data.south;
    return [...data.north, ...data.south];
  }, [data, selectedZone]);

  // Dynamically extract top category tags for the currently selected zone (North / South / All)
  const dynamicCategoryTags = useMemo(() => {
    const counts: Record<string, number> = {};
    eateriesList.forEach(item => {
      if (item.categoryName && !item.permanentlyClosed) {
        const cat = item.categoryName.trim();
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    const sortedCats = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    // Pick top 12 categories for current zone, starting with 'All'
    return ['All', ...sortedCats.slice(0, 12)];
  }, [eateriesList]);

  const handleZoneChange = (zone: 'all' | 'north' | 'south') => {
    setSelectedZone(zone);
    setSelectedCategory('All');
  };

  const filteredEateries = useMemo(() => {
    return eateriesList.filter(item => {
      if (item.permanentlyClosed) return false;

      // Category filter
      if (selectedCategory !== 'All') {
        const cat = (item.categoryName || '').toLowerCase();
        if (!cat.includes(selectedCategory.toLowerCase())) return false;
      }

      // Rating filter
      if (minRating > 0 && (item.totalScore || 0) < minRating) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const subTitleMatch = (item.subTitle || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const addrMatch = (item.address || '').toLowerCase().includes(q);
        const neighMatch = (item.neighborhood || '').toLowerCase().includes(q);
        return titleMatch || subTitleMatch || descMatch || addrMatch || neighMatch;
      }

      return true;
    });
  }, [eateriesList, selectedCategory, minRating, searchQuery]);

  const visibleEateries = useMemo(() => {
    return filteredEateries.slice(0, displayLimit);
  }, [filteredEateries, displayLimit]);

  return (
    <div 
      className="w-full bg-[#FAF6ED] bg-cover bg-center bg-fixed bg-no-repeat min-h-screen pt-24 pb-32 relative text-ink"
      style={{ backgroundImage: "url('/food.png')" }}
    >
      
      {/* Soft overlay for contrast & readability */}
      <div className="absolute inset-0 bg-[#FAF6ED]/75 pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* Back Button & Top Subheader */}
        <div className="flex items-center justify-between mb-8 border-b border-ink/10 pb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-ink/60 hover:text-bengali-red transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>হোমে ফিরুন (Back to Home)</span>
            </button>
          )}
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-bengali-red font-bold">
            কলকাতার খাঁটি রেস্তোরাঁ ও ক্যাফে ডিরেক্টরি
          </span>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-ink/40">
            গুগল ম্যাপস যাচাইকৃত • ১,০০০+ টি স্থান
          </span>
          <h1 className="text-4xl md:text-6xl font-serif text-ink italic font-normal">
            কলকাতার রেস্তোরাঁ ডিরেক্টরি
          </h1>
          <p className="text-sm font-serif italic text-ink/60 max-w-xl mx-auto">
            উত্তর ও দক্ষিণ কলকাতার ঐতিহ্যবাহী ক্যাফে, কাটলেট শপ, মিষ্টির দোকান ও সুস্বাদু খাবারের ঠিকানা।
          </p>
        </div>

        {/* PROMINENT REGION SELECTOR TABS (North / South / All Kolkata) */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="bg-[#FAF6ED]/95 backdrop-blur-md p-1.5 rounded-2xl border-2 border-ink/15 shadow-md flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleZoneChange('all')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-serif font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedZone === 'all'
                  ? 'bg-bengali-red text-white shadow-lg scale-[1.02] border border-[#DFB86C]/40'
                  : 'text-ink/70 hover:text-ink hover:bg-ink/5'
              }`}
            >
              <span>🌟 সমগ্র কলকাতা</span>
              <span className="text-[10px] font-mono opacity-80 px-1.5 py-0.5 rounded-md bg-black/10">All</span>
            </button>
            <button
              onClick={() => handleZoneChange('north')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-serif font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedZone === 'north'
                  ? 'bg-bengali-red text-white shadow-lg scale-[1.02] border border-[#DFB86C]/40'
                  : 'text-ink/70 hover:text-ink hover:bg-ink/5'
              }`}
            >
              <span>🏛️ উত্তর কলকাতা</span>
              <span className="text-[10px] font-mono opacity-80 px-1.5 py-0.5 rounded-md bg-black/10">North</span>
            </button>
            <button
              onClick={() => handleZoneChange('south')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-serif font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedZone === 'south'
                  ? 'bg-bengali-red text-white shadow-lg scale-[1.02] border border-[#DFB86C]/40'
                  : 'text-ink/70 hover:text-ink hover:bg-ink/5'
              }`}
            >
              <span>🌳 দক্ষিণ কলকাতা</span>
              <span className="text-[10px] font-mono opacity-80 px-1.5 py-0.5 rounded-md bg-black/10">South</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS CONTAINER */}
        <div 
          className="bg-[length:106%_106%] bg-center bg-no-repeat bg-[#FAF6ED] rounded-2xl p-6 md:p-8 mb-12 shadow-sm space-y-5 relative overflow-hidden border border-ink/10"
          style={{ backgroundImage: "url('/food-banner.png')" }}
        >
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                selectedZone === 'north'
                  ? "উত্তর কলকাতার খাবারের স্থান খুঁজুন (যেমন: মিত্র ক্যাফে, শ্যামবাজার, কলেজ স্ট্রিট...)"
                  : selectedZone === 'south'
                  ? "দক্ষিণ কলকাতার খাবারের স্থান খুঁজুন (যেমন: গড়িয়াহাট, পার্ক স্ট্রিট, গলপার্ক...)"
                  : "খাবারের স্থান, ক্যাফে বা এলাকা দিয়ে খুঁজুন (যেমন: মিত্র ক্যাফে, গড়িয়াহাট, পার্ক স্ট্রিট...)"
              }
              className="w-full bg-paper/95 backdrop-blur-xs border border-ink/15 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm font-serif text-ink placeholder:text-ink/40 focus:outline-none focus:border-bengali-red/50 transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-ink/40 hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3">
            
            {/* Category Badges (Dynamically loaded per zone) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {dynamicCategoryTags.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-serif transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-bengali-red text-paper border-bengali-red font-bold shadow-xs'
                      : 'bg-paper/90 backdrop-blur-xs text-ink/70 border-ink/10 hover:border-ink/30'
                  }`}
                >
                  {cat === 'All' ? 'সবকিছু (All)' : cat}
                </button>
              ))}
            </div>

            {/* Min Rating Filter */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-mono text-ink/50 uppercase">রেটিং:</span>
              {[0, 4.0, 4.2, 4.5].map(r => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                    minRating === r
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-paper/90 backdrop-blur-xs text-ink/60 border border-ink/10 hover:text-ink'
                  }`}
                >
                  {r === 0 ? 'All' : `${r}★+`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS HEADER */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="text-xs font-mono text-ink/60 uppercase tracking-wider">
            দেখাচ্ছে: <span className="font-bold text-bengali-red">{visibleEateries.length}</span> / <span className="font-bold text-ink">{filteredEateries.length}</span> টি রেস্তোরাঁ ও ক্যাফে
          </div>
          {(searchQuery || selectedCategory !== 'All' || minRating > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setMinRating(0);
              }}
              className="text-xs font-mono text-bengali-red hover:underline cursor-pointer"
            >
              রিসেট করুন (Reset)
            </button>
          )}
        </div>

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="bg-[#FAF6ED] border border-ink/10 rounded-2xl p-16 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-bengali-red animate-spin mx-auto" />
            <p className="text-xs font-mono text-ink/60">রেস্তোরাঁ ডিরেক্টরি ক্যাশ থেকে লোড হচ্ছে...</p>
          </div>
        ) : filteredEateries.length > 0 ? (
          <>
            {/* EATERIES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleEateries.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className="bg-[#FAF6ED] border border-ink/10 rounded-xl overflow-hidden hover:shadow-md hover:border-bengali-red/30 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    
                    {/* Cover Image (Compact h-32) */}
                    {item.imageUrl ? (
                      <div className="w-full h-32 overflow-hidden relative bg-ink/5">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            const cat = (item.categoryName || '').toLowerCase();
                            if (cat.includes('biryani')) {
                              target.src = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80';
                            } else if (cat.includes('cafe') || cat.includes('coffee')) {
                              target.src = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80';
                            } else if (cat.includes('bakery') || cat.includes('cake') || cat.includes('sweet')) {
                              target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80';
                            } else if (cat.includes('chinese') || cat.includes('noodle')) {
                              target.src = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80';
                            } else {
                              target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80';
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        {/* Price Pill */}
                        {item.price && (
                          <span className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-amber-300/30">
                            {item.price}
                          </span>
                        )}

                        {/* Category Tag */}
                        {item.categoryName && (
                          <span className="absolute bottom-2 left-2 bg-bengali-red/90 backdrop-blur-md text-paper px-2 py-0.5 rounded text-[10px] font-serif font-bold truncate max-w-[80%]">
                            {item.categoryName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-16 bg-bengali-red/5 border-b border-ink/5 p-3 flex items-center justify-between">
                        <span className="text-[11px] font-serif font-bold text-bengali-red bg-bengali-red/10 px-2 py-0.5 rounded truncate">
                          {item.categoryName || 'Eatery'}
                        </span>
                        {item.price && (
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {item.price}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Content (Compact Padding) */}
                    <div className="p-3.5 space-y-2">

                      {/* Title & Bengali Subtitle */}
                      <div>
                        <h3 className="text-sm font-serif font-bold text-ink leading-snug group-hover:text-bengali-red transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        {item.subTitle && (
                          <p className="text-[11px] font-serif text-bengali-red font-bold truncate mt-0.5">
                            {item.subTitle}
                          </p>
                        )}
                      </div>

                      {/* Rating & Reviews */}
                      {item.totalScore && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-800 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono font-bold text-[11px]">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{item.totalScore.toFixed(1)}</span>
                          </div>
                          {item.reviewsCount && (
                            <span className="text-[10px] font-mono text-ink/40">
                              ({item.reviewsCount} reviews)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Address */}
                      {item.address && (
                        <div className="flex items-start gap-1 text-[11px] font-serif text-ink/70 leading-tight">
                          <MapPin className="w-3 h-3 text-bengali-red flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.address}</span>
                        </div>
                      )}

                      {/* Phone Number */}
                      {item.phone && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-ink/60 truncate">
                          <Phone className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                          <span className="truncate">{item.phone}</span>
                        </div>
                      )}

                      {/* Opening Hours */}
                      {item.openingHours && item.openingHours.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-ink/50 bg-paper/40 p-1 rounded truncate">
                          <Clock className="w-2.5 h-2.5 text-ink/40 flex-shrink-0" />
                          <span className="truncate">{item.openingHours[0].hours}</span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Direct Google Maps Navigation Button */}
                  <div className="p-3.5 pt-0">
                    <a
                      href={item.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title + ' ' + (item.address || 'Kolkata'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-bengali-red text-paper hover:bg-[#721724] px-3 py-1.5 rounded-lg text-[11px] font-serif font-bold transition-all shadow-sm group-hover:shadow"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Google Maps নির্দেশ</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>

            {/* LOAD MORE BUTTON */}
            {displayLimit < filteredEateries.length && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 32)}
                  className="px-8 py-3 bg-bengali-red text-white text-xs font-serif font-bold rounded-2xl hover:bg-[#721724] transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  আরো দেখান (Load More Eateries - Showing {visibleEateries.length} of {filteredEateries.length})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#FAF6ED] border border-ink/10 rounded-2xl p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-bengali-red/10 text-bengali-red mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-ink">কোনো স্থান পাওয়া যায়নি</h3>
            <p className="text-xs font-serif italic text-ink/50 max-w-sm mx-auto">
              আপনার খোঁজার সাথে মেলে এমন কোনো রেস্তোরাঁ পাওয়া যায়নি। অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন।
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setMinRating(0);
              }}
              className="px-5 py-2.5 bg-bengali-red text-paper text-xs font-serif font-bold rounded-xl hover:bg-[#721724] transition-colors cursor-pointer"
            >
              ফিল্টার রিসেট করুন (Reset)
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default FacilitiesSection;
