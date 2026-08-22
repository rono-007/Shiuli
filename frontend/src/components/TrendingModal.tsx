import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Sparkles, TrendingUp, Award, Compass,
  Layers, Lightbulb, Flame, MapPin, CheckCircle2, ChevronRight,
  BarChart3, Camera, Landmark, Palette, MessageSquare, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TrendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectZone?: (zone: 'north' | 'central' | 'south' | 'bonedi') => void;
}

interface PandalTrending {
  rank_reference: number;
  name: string;
  zone: string;
  primary_category: string;
  key_selling_point: string;
  what_makes_it_stand_out: string[];
  primary_popularity_drivers: string[];
}

interface TrendingData {
  analysis_title?: string;
  core_popularity_framework?: {
    popularity_formula?: string;
    popularity_flywheel?: string[];
  };
  absolute_top_drivers?: string[];
  pandals?: PandalTrending[];
  comparative_insights?: Record<string, { description: string; strong_examples: string[] }>;
  major_trends_2020_2025?: Array<{ trend: string; description: string }>;
  critical_findings?: Array<{ finding: string; explanation: string }>;
  ultimate_success_model?: {
    formula?: string;
    ideal_pandal_sequence?: string[];
  };
}

const TrendingModal: React.FC<TrendingModalProps> = ({ isOpen, onClose, onSelectZone }) => {
  const { t, language } = useLanguage();
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState<'pandals' | 'framework' | 'trends'>('pandals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trending intelligence from FastAPI backend
  useEffect(() => {
    if (!isOpen) return;

    // Return if already fetched
    if (data) return;

    const fetchTrendingData = async () => {
      setLoading(true);
      setError(null);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';

      try {
        const res = await fetch(`${baseUrl}/api/trending`);
        if (!res.ok) {
          throw new Error(`Failed to fetch trending data (Status ${res.status})`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        console.error('Error fetching trending data from backend:', err);
        setError(err instanceof Error ? err.message : 'Unable to connect to backend');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, [isOpen, data]);

  const pandals: PandalTrending[] = data?.pandals || [];

  // Extract unique categories & zones
  const categories = useMemo(() => {
    const set = new Set<string>();
    pandals.forEach(p => {
      if (p.primary_category) set.add(p.primary_category);
    });
    return Array.from(set).sort();
  }, [pandals]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    pandals.forEach(p => {
      if (p.zone) set.add(p.zone);
    });
    return Array.from(set).sort();
  }, [pandals]);

  // Filter pandals
  const filteredPandals = useMemo(() => {
    return pandals.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) ||
        p.zone.toLowerCase().includes(q) ||
        p.primary_category.toLowerCase().includes(q) ||
        p.key_selling_point.toLowerCase().includes(q) ||
        p.what_makes_it_stand_out.some(s => s.toLowerCase().includes(q)) ||
        p.primary_popularity_drivers.some(d => d.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'all' || p.primary_category === selectedCategory;
      const matchesZone = selectedZone === 'all' || p.zone === selectedZone;

      return matchesSearch && matchesCategory && matchesZone;
    });
  }, [pandals, searchQuery, selectedCategory, selectedZone]);

  if (!isOpen) return null;

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('spectacle') || cat.includes('king')) {
      return 'bg-amber-500/15 text-amber-900 border-amber-500/30';
    }
    if (cat.includes('heritage') || cat.includes('traditional')) {
      return 'bg-rose-500/15 text-rose-900 border-rose-500/30';
    }
    if (cat.includes('art') || cat.includes('concept')) {
      return 'bg-purple-500/15 text-purple-900 border-purple-500/30';
    }
    if (cat.includes('story') || cat.includes('cultural')) {
      return 'bg-emerald-500/15 text-emerald-900 border-emerald-500/30';
    }
    if (cat.includes('instagram')) {
      return 'bg-pink-500/15 text-pink-900 border-pink-500/30';
    }
    return 'bg-sky-500/15 text-sky-900 border-sky-500/30';
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('spectacle') || cat.includes('king')) return Landmark;
    if (cat.includes('heritage') || cat.includes('traditional')) return Award;
    if (cat.includes('art') || cat.includes('concept')) return Palette;
    if (cat.includes('story') || cat.includes('cultural')) return MessageSquare;
    if (cat.includes('instagram')) return Camera;
    return Sparkles;
  };

  const handleZoneNavigate = (zoneStr: string) => {
    if (!onSelectZone) return;
    const z = zoneStr.toLowerCase();
    if (z.includes('north')) onSelectZone('north');
    else if (z.includes('central')) onSelectZone('central');
    else if (z.includes('south')) onSelectZone('south');
    else if (z.includes('bonedi')) onSelectZone('bonedi');
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-[#1A090B]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 z-50 animate-fade-in-fast overflow-hidden"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF6ED] text-[#3D0D11] w-full max-w-5xl max-h-[92vh] flex flex-col border-2 border-[#D4A24C]/60 shadow-2xl relative rounded-[2rem] overflow-hidden font-sans"
      >
        {/* Decorative Top Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#941F28]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#DFB86C]/20 rounded-full blur-3xl pointer-events-none" />

        {/* ─── Modal Header ────────────────────────────────────────────── */}
        <div className="p-5 sm:p-7 border-b border-[#3D0D11]/10 relative z-10 flex-shrink-0 bg-[#FAF6ED]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#7A1F26]/10 border border-[#7A1F26]/20 text-[#7A1F26] text-xs font-mono font-bold tracking-wider uppercase mb-2">
                <Flame className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>{t.trendingModalTag}</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#3D0D11] tracking-tight font-serif">
                {t.trendingModalTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#3D0D11]/75 font-sans mt-0.5 max-w-2xl leading-snug">
                {t.trendingModalSubtitle}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-full border border-[#3D0D11]/15 bg-white/90 hover:bg-white text-[#3D0D11]/70 hover:text-[#7A1F26] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-3 mt-5 border-b border-[#3D0D11]/10 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('pandals')}
              className={`pb-2.5 px-1 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pandals'
                  ? 'border-[#7A1F26] text-[#7A1F26]'
                  : 'border-transparent text-[#3D0D11]/60 hover:text-[#3D0D11]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t.trendingTabPandals}</span>
              {pandals.length > 0 && (
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#7A1F26]/10 text-[#7A1F26] font-bold">
                  {pandals.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('framework')}
              className={`pb-2.5 px-1 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'framework'
                  ? 'border-[#7A1F26] text-[#7A1F26]'
                  : 'border-transparent text-[#3D0D11]/60 hover:text-[#3D0D11]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.trendingTabFramework}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`pb-2.5 px-1 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'trends'
                  ? 'border-[#7A1F26] text-[#7A1F26]'
                  : 'border-transparent text-[#3D0D11]/60 hover:text-[#3D0D11]'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>{t.trendingTabTrends}</span>
            </button>
          </div>
        </div>

        {/* ─── Modal Scrollable Body ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 relative z-10 custom-scrollbar">

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-[#7A1F26] animate-spin" />
              <p className="text-sm font-serif text-[#3D0D11]/70">
                {isBn ? 'বিশ্লেষণ ডেটা লোড করা হচ্ছে...' : 'Loading trending intelligence from backend API...'}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <h4 className="text-sm font-bold">{isBn ? 'ডেটা লোড করতে ব্যর্থ হয়েছে' : 'Failed to load trending data'}</h4>
                <p className="text-xs text-rose-700/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Data Content */}
          {!loading && !error && data && (
            <>
              {/* TAB 1: PANDALS LIST & CARDS */}
              {activeTab === 'pandals' && (
                <div className="space-y-5">
                  {/* Filter & Search Bar */}
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3D0D11]/50" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.trendingSearchPlaceholder}
                        className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#3D0D11]/20 rounded-xl text-sm text-[#3D0D11] placeholder-[#3D0D11]/40 focus:outline-none focus:border-[#7A1F26] focus:ring-1 focus:ring-[#7A1F26]/30 shadow-xs"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3D0D11]/50 hover:text-[#7A1F26]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Selector */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      aria-label="Filter by Category"
                      className="px-3 py-2.5 bg-white border border-[#3D0D11]/20 rounded-xl text-xs sm:text-sm text-[#3D0D11] font-medium focus:outline-none focus:border-[#7A1F26] cursor-pointer shadow-xs"
                    >
                      <option value="all">{t.trendingAllCategories} ({pandals.length})</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Zone Selector */}
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      aria-label="Filter by Zone"
                      className="px-3 py-2.5 bg-white border border-[#3D0D11]/20 rounded-xl text-xs sm:text-sm text-[#3D0D11] font-medium focus:outline-none focus:border-[#7A1F26] cursor-pointer shadow-xs"
                    >
                      <option value="all">{t.trendingAllZones}</option>
                      {zones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status counter */}
                  <div className="flex items-center justify-between text-xs text-[#3D0D11]/60 font-mono">
                    <span>
                      {isBn ? `প্রদর্শিত হচ্ছে: ${filteredPandals.length} টি পুজো (মোট ${pandals.length} টির মধ্যে)` : `Showing ${filteredPandals.length} of ${pandals.length} analyzed pandals`}
                    </span>
                    {(selectedCategory !== 'all' || selectedZone !== 'all' || searchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedZone('all');
                          setSearchQuery('');
                        }}
                        className="text-[#7A1F26] hover:underline font-semibold cursor-pointer"
                      >
                        {isBn ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                      </button>
                    )}
                  </div>

                  {/* Pandals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPandals.map((pandal) => {
                      const CatIcon = getCategoryIcon(pandal.primary_category);
                      const isTop3 = pandal.rank_reference <= 3;
                      return (
                        <div
                          key={pandal.rank_reference}
                          className="group bg-white border border-[#3D0D11]/15 hover:border-[#7A1F26]/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            {/* Top Meta: Rank + Zone + Category */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                                  isTop3 
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-xs' 
                                    : 'bg-[#FAF6ED] text-[#7A1F26] border-[#7A1F26]/20'
                                }`}>
                                  #{pandal.rank_reference}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#3D0D11]/5 text-[#3D0D11]/70">
                                  <MapPin className="w-3 h-3 text-[#7A1F26]" />
                                  {pandal.zone}
                                </span>
                              </div>

                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(pandal.primary_category)}`}>
                                <CatIcon className="w-3 h-3" />
                                <span>{pandal.primary_category}</span>
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-[#3D0D11] group-hover:text-[#7A1F26] transition-colors font-serif mb-2">
                              {pandal.name}
                            </h3>

                            {/* Key Selling Point Box */}
                            <div className="bg-[#FAF6ED] border-l-3 border-[#D4A24C] p-2.5 rounded-r-xl mb-3">
                              <span className="text-[10px] font-mono uppercase font-bold text-[#7A1F26] block tracking-wider mb-0.5">
                                {t.trendingKeySellingPoint}
                              </span>
                              <p className="text-xs text-[#3D0D11]/85 leading-relaxed font-serif italic">
                                "{pandal.key_selling_point}"
                              </p>
                            </div>

                            {/* Standout Features */}
                            <div className="mb-3 space-y-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-[#3D0D11]/50 block tracking-wider">
                                {t.trendingStandout}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {pandal.what_makes_it_stand_out.map((feat, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-[10px] bg-slate-100/90 text-slate-800 border border-slate-200/80 px-2 py-0.5 rounded-md font-sans"
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5 text-[#D4A24C]" />
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Footer: Drivers + Navigation */}
                          <div className="pt-3 border-t border-[#3D0D11]/10 flex items-center justify-between gap-2 mt-2">
                            <div className="flex flex-wrap gap-1">
                              {pandal.primary_popularity_drivers.slice(0, 3).map((driver, dIdx) => (
                                <span 
                                  key={dIdx}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#7A1F26]/5 text-[#7A1F26] font-semibold"
                                >
                                  #{driver}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleZoneNavigate(pandal.zone)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A1F26] hover:text-[#5A141A] cursor-pointer group-hover:translate-x-0.5 transition-transform flex-shrink-0"
                            >
                              <span>{t.trendingExploreTour}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredPandals.length === 0 && (
                    <div className="text-center py-16 bg-white border border-[#3D0D11]/10 rounded-2xl p-6">
                      <Compass className="w-10 h-10 text-[#3D0D11]/30 mx-auto mb-2" />
                      <h4 className="text-base font-bold text-[#3D0D11]">
                        {isBn ? 'কোনো প্যান্ডেল পাওয়া যায়নি' : 'No pandals found matching criteria'}
                      </h4>
                      <p className="text-xs text-[#3D0D11]/60 mt-1">
                        {isBn ? 'দয়া করে অনুসন্ধান শব্দ পরিবর্তন করুন।' : 'Try adjusting your search query or filters.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: POPULARITY BLUEPRINT & FORMULA */}
              {activeTab === 'framework' && (
                <div className="space-y-6">
                  {/* Formula Card */}
                  <div className="bg-gradient-to-br from-[#7A1F26] via-[#941F28] to-[#66161C] text-white p-5 sm:p-7 rounded-2xl shadow-lg border border-[#D4A24C]/40">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#DFB86C] text-xs font-mono font-bold tracking-wider uppercase mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-[#DFB86C]" />
                      <span>The Core Popularity Equation</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif mb-2 text-[#FAF6ED]">
                      {data.core_popularity_framework?.popularity_formula || 'Popularity = Novelty + Visual Impact + Emotional Resonance + Accessibility + Reputation + Social Proof + Visibility'}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 font-sans leading-relaxed">
                      {isBn 
                        ? 'কলকাতার সেরা লোক-আকর্ষক দুর্গাপূজার জনপ্রিয়তা শুধুমাত্র বাজেটের উপর নির্ভর করে না; এটি সৃজনশীল পরিকল্পনা, স্থাপত্যের বিশালতা, ও সামাজিক মাধ্যমের দৃশ্যমানতার মেলবন্ধন।'
                        : 'Durga Puja popularity in Kolkata is a strategic synthesis of artistic depth, landmark scale, experiential wonder, and immediate viral shareability.'}
                    </p>
                  </div>

                  {/* The Popularity Flywheel */}
                  <div className="bg-white border border-[#3D0D11]/15 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <h4 className="text-base font-bold text-[#3D0D11] font-serif mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#7A1F26]" />
                      {isBn ? 'জনপ্রিয়তার ফ্লাইহুইল (The Popularity Flywheel)' : 'The Popularity Flywheel'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(data.core_popularity_framework?.popularity_flywheel || []).map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF6ED] border border-[#3D0D11]/10">
                          <span className="w-6 h-6 rounded-full bg-[#7A1F26] text-white text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-[#3D0D11] leading-snug">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4 Core Comparative Archetypes */}
                  <div className="bg-white border border-[#3D0D11]/15 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <h4 className="text-base font-bold text-[#3D0D11] font-serif mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#7A1F26]" />
                      {isBn ? '৪টি মূল জনপ্রিয়তার ধরন (Comparative Archetypes)' : '4 Core Popularity Archetypes'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.comparative_insights && Object.entries(data.comparative_insights).map(([key, val]) => {
                        const titles: Record<string, string> = {
                          footfall_popularity: 'Footfall Kings (জনসমাগমের শীর্ষ)',
                          cultural_popularity: 'Cultural Powerhouses (ঐতিহ্যের ধারক)',
                          digital_popularity: 'Digital / Viral Sensation (ডিজিটাল ভাইরাল)',
                          artistic_respect: 'Artistic Respect (শিল্পকলা ও স্বীকৃতি)'
                        };
                        return (
                          <div key={key} className="p-4 rounded-xl bg-[#FAF6ED] border border-[#3D0D11]/10 space-y-2">
                            <h5 className="text-sm font-bold text-[#7A1F26] font-serif">
                              {titles[key] || key}
                            </h5>
                            <p className="text-xs text-[#3D0D11]/75 leading-relaxed">
                              {val.description}
                            </p>
                            <div className="pt-2 border-t border-[#3D0D11]/10">
                              <span className="text-[10px] font-mono text-[#3D0D11]/50 uppercase font-bold block mb-1">
                                Key Examples:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {val.strong_examples?.map((ex, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#3D0D11]/15 font-medium text-[#3D0D11]">
                                    {ex}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Absolute Top Drivers */}
                  <div className="bg-white border border-[#3D0D11]/15 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <h4 className="text-base font-bold text-[#3D0D11] font-serif mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D4A24C]" />
                      {isBn ? 'জনপ্রিয়তার শীর্ষ ৮ নিয়ামক' : 'The 8 Absolute Top Popularity Drivers'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(data.absolute_top_drivers || []).map((driver, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#3D0D11] p-2 rounded-lg bg-[#FAF6ED]/70 border border-[#3D0D11]/5">
                          <span className="w-2 h-2 rounded-full bg-[#7A1F26]" />
                          <span className="font-semibold">{driver}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TRENDS & CRITICAL INSIGHTS */}
              {activeTab === 'trends' && (
                <div className="space-y-6">
                  {/* Major Trends (2020-2025) */}
                  <div className="bg-white border border-[#3D0D11]/15 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-[#3D0D11] font-serif flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#7A1F26]" />
                        {isBn ? '২০২০-২০২৬ সালের প্রধান প্রবণতাসমূহ' : 'Major Festival Trends (2020–2026)'}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7A1F26]/10 text-[#7A1F26] font-bold">
                        8 Macro Shifts
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {(data.major_trends_2020_2025 || []).map((tr, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#3D0D11]/10 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#7A1F26]">0{idx + 1}.</span>
                            <h5 className="text-xs sm:text-sm font-bold text-[#3D0D11] font-serif">
                              {tr.trend}
                            </h5>
                          </div>
                          <p className="text-xs text-[#3D0D11]/70 leading-relaxed pl-5">
                            {tr.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Critical Strategic Findings */}
                  <div className="bg-white border border-[#3D0D11]/15 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <h4 className="text-base font-bold text-[#3D0D11] font-serif mb-4 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[#D4A24C]" />
                      {isBn ? 'কৌশলগত গুরুত্বপূর্ণ পর্যবেক্ষণ' : 'Critical Strategic Findings'}
                    </h4>
                    <div className="space-y-3">
                      {(data.critical_findings || []).map((cf, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#3D0D11]/10 flex flex-col sm:flex-row sm:items-baseline gap-2">
                          <span className="text-xs font-bold text-[#7A1F26] sm:w-1/3 flex-shrink-0 font-serif">
                            ✦ {cf.finding}
                          </span>
                          <span className="text-xs text-[#3D0D11]/75 leading-relaxed sm:w-2/3">
                            {cf.explanation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ultimate Formula Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF6ED] to-[#F2E8D5] border-2 border-[#D4A24C]/40 text-center space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A1F26] font-bold">
                      The Ultimate Formula for Lasting Success
                    </span>
                    <p className="text-base sm:text-lg font-serif font-bold text-[#3D0D11]">
                      "{data.ultimate_success_model?.formula || 'Culture + Art + Spectacle + Story + Shareability + Accessibility + Reputation'}"
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* ─── Modal Footer ────────────────────────────────────────────── */}
        <div className="p-3.5 sm:p-4 bg-[#FAF6ED] border-t border-[#3D0D11]/10 flex items-center justify-between text-xs text-[#3D0D11]/50 font-mono z-10">
          <span>Shiuli Durga Puja Popularity Index 2020–2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#7A1F26] text-white hover:bg-[#66161C] font-semibold text-xs transition-colors cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TrendingModal;
