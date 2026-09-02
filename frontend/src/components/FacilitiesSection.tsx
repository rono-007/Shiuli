import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, MapPin, ExternalLink, Star, Phone, Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  queryLocalFood, 
  startBackgroundPreload, 
  isFoodCacheReady,
  getFoodCategories
} from '../utils/foodCache';

interface EateryLocation {
  lat: number;
  lng: number;
}

interface OpeningHour {
  day: string;
  hours: string;
}

interface Eatery {
  id?: string;
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


const baseUrl = import.meta.env.VITE_API_URL || 'https://shiuli-backend.onrender.com';

const FacilitiesSection: React.FC<FacilitiesSectionProps> = ({ onBack }) => {
  const { t } = useLanguage();
  
  const [data, setData] = useState<Eatery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<'all' | 'north' | 'south'>('all');
  
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [dynamicCategoryTags, setDynamicCategoryTags] = useState<string[]>(['All']);

  // Fetch categories when zone changes or cache is ready
  useEffect(() => {
    if (isFoodCacheReady()) {
      setDynamicCategoryTags(getFoodCategories(selectedZone));
    }
  }, [selectedZone, data]); // re-run if data changes (meaning cache is now ready)

  // Fetch paginated food data entirely from static JSON cache
  useEffect(() => {
    let isMounted = true;
    
    const loadStaticData = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      // Ensure cache is populated
      await startBackgroundPreload();

      if (!isMounted) return;

      const resData = queryLocalFood({
        page,
        limit: 24,
        zone: selectedZone,
        category: selectedCategory,
        minRating,
        search: searchQuery
      });

      if (page === 1) {
        setData(resData.data);
      } else {
        setData(prev => {
          const existingIds = new Set(prev.map(i => i.id || i.title));
          const uniqueNewItems = resData.data.filter((i: any) => !existingIds.has(i.id || i.title));
          return [...prev, ...uniqueNewItems];
        });
      }
      
      setTotalCount(resData.pagination.total);
      setHasMore(page < resData.pagination.total_pages);
      setLoading(false);
      setLoadingMore(false);
    };

    loadStaticData();

    return () => { isMounted = false; };
  }, [page, selectedZone, selectedCategory, minRating, searchQuery, baseUrl]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, minRating, selectedZone]);

  const handleZoneChange = (zone: 'all' | 'north' | 'south') => {
    setSelectedZone(zone);
    setSelectedCategory('All');
  };

  const visibleEateries = data;
  const filteredEateries = { length: totalCount };

  return (
    <div 
      className="w-full bg-[#FAF6ED] bg-cover bg-center bg-fixed bg-no-repeat min-h-screen pt-24 pb-32 relative text-ink"
      style={{ backgroundImage: "url('/food.webp')" }}
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
              <span>{t.backToHome}</span>
            </button>
          )}
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-bengali-red font-bold">
            {t.foodTitle}
          </span>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-ink/40">
            গুগল ম্যাপস যাচাইকৃত • ১,০০০+ টি স্থান
          </span>
          <h1 className="text-4xl md:text-6xl font-serif text-ink italic font-normal">
            {t.foodTitle}
          </h1>
          <p className="text-sm font-serif italic text-ink/60 max-w-xl mx-auto">
            {t.foodSubtitle}
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
              <span>🌟 {t.allKolkataTab}</span>
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
              <span>🏛️ {t.northKolkataTab}</span>
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
              <span>🌳 {t.southKolkataTab}</span>
              <span className="text-[10px] font-mono opacity-80 px-1.5 py-0.5 rounded-md bg-black/10">South</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS CONTAINER */}
        <div 
          className="bg-[length:106%_106%] bg-center bg-no-repeat bg-[#FAF6ED] rounded-2xl p-6 md:p-8 mb-12 shadow-sm space-y-5 relative overflow-hidden border border-ink/10"
          style={{ backgroundImage: "url('/food-banner.webp')" }}
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
                  ? t.searchPlaceholderNorth
                  : selectedZone === 'south'
                  ? t.searchPlaceholderSouth
                  : t.searchPlaceholderAll
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
                  {cat === 'All' ? t.allCategoryTag : cat}
                </button>
              ))}
            </div>

            {/* Min Rating Filter */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-mono text-ink/50 uppercase">{t.ratingLabel}</span>
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
            {t.showingCount} <span className="font-bold text-bengali-red">{visibleEateries.length}</span> / <span className="font-bold text-ink">{filteredEateries.length}</span>
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
              {t.resetBtn}
            </button>
          )}
        </div>

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="bg-[#FAF6ED] border border-ink/10 rounded-2xl p-16 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-bengali-red animate-spin mx-auto" />
            <p className="text-xs font-mono text-ink/60">{t.loadingText}</p>
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
                    
                    {/* Cover Image */}
                    {item.imageUrl ? (
                      <div className="w-full h-36 overflow-hidden relative bg-[#FAF6ED] border-b border-ink/10">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.currentTarget;

                            // Stage 1: Try CDN image proxy
                            if (!target.dataset.proxyAttempt && item.imageUrl) {
                              target.dataset.proxyAttempt = '1';
                              target.src = `https://images.weserv.nl/?url=${encodeURIComponent(item.imageUrl)}&w=500&h=350&fit=cover&output=webp`;
                              return;
                            }

                            // Stage 2: Deterministic unique photo per restaurant
                            target.onerror = null;

                            // 30 diverse, curated food/restaurant/cafe photos
                            const pool = [
                              'photo-1517248135467-4c7edcad34c4', // elegant restaurant interior
                              'photo-1552566626-52f8b828add9', // colorful indian thali
                              'photo-1555396273-367ea4eb4db5', // warm restaurant ambiance
                              'photo-1414235077428-338989a2e8c0', // fine dining plate
                              'photo-1504674900247-0877df9cc836', // grilled food close-up
                              'photo-1476224203421-9ac39bcb3327', // rustic meal setup
                              'photo-1540189549336-e6e99c3679fe', // indian street food
                              'photo-1565299624946-b28f40a0ae38', // pizza / flatbread
                              'photo-1565958011703-44f9829ba187', // dessert plate
                              'photo-1567620905732-2d1ec7ab7445', // plated dish
                              'photo-1546069901-ba9599a7e63c', // indian curry spread
                              'photo-1585032226651-759b368d7246', // noodles bowl
                              'photo-1563379091339-03b21ab4a4f8', // biryani
                              'photo-1626777552726-4a6b54c97e46', // bengali thali
                              'photo-1554118811-1e0d58224f24', // cafe interior
                              'photo-1509440159596-0249088772ff', // bakery bread
                              'photo-1610192244261-3f33de3f55e4', // dosa
                              'photo-1512621776951-a57141f2eefd', // fresh salad plate
                              'photo-1498654896293-37aacf113fd9', // food platter
                              'photo-1473093295043-cdd812d0e601', // pasta dish
                              'photo-1559847844-5315695dadae', // tandoori chicken
                              'photo-1601050690597-df0568f70950', // samosa
                              'photo-1551218808-94e220e084d2', // coffee and pastry
                              'photo-1571091718767-18b5b1457add', // burger
                              'photo-1569058242253-92a9c755a0ec', // chaat
                              'photo-1505253716362-afaea1d3d1af', // colorful curry bowls
                              'photo-1466978913421-dad2ebd01d17', // cafe latte art
                              'photo-1484723091739-30a097e8f929', // pancakes
                              'photo-1588166524941-3bf61a9c41db', // momos
                              'photo-1606491956689-2ea866880049', // kebabs
                            ];

                            // Simple hash from title to pick a unique image
                            const name = item.title || '';
                            let hash = 0;
                            for (let i = 0; i < name.length; i++) {
                              hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
                            }
                            const idx = Math.abs(hash) % pool.length;
                            target.src = `https://images.unsplash.com/${pool[idx]}?w=500&auto=format&fit=crop&q=80`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                        
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
                      <span>{t.googleMapsDir}</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>

            {/* LOAD MORE BUTTON */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-bengali-red text-white text-xs font-serif font-bold rounded-2xl hover:bg-[#721724] transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t.loadMoreBtn} ({visibleEateries.length} / {filteredEateries.length})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#FAF6ED] border border-ink/10 rounded-2xl p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-bengali-red/10 text-bengali-red mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-ink">{t.noPlacesFound}</h3>
            <p className="text-xs font-serif italic text-ink/50 max-w-sm mx-auto">
              {t.noPlacesFoundDesc}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setMinRating(0);
              }}
              className="px-5 py-2.5 bg-bengali-red text-paper text-xs font-serif font-bold rounded-xl hover:bg-[#721724] transition-colors cursor-pointer"
            >
              {t.resetBtn}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default FacilitiesSection;
