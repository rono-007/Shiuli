import React, { useState, useEffect } from 'react';
import metrosData from '../data/metros.json';
import { ArrowLeft, Map, Clock, Zap, Coffee, CheckCircle, MapPin, Navigation } from 'lucide-react';

interface MetroStation {
  name: string;
  api_name: string;
  address: string;
  lat: number;
  lon: number;
}

interface RouteStop {
  name: string;
  address: string;
  lat: number;
  lon: number;
  estimated_travel_min: number;
  cumulative_time_min: number;
}

interface RoutePlanResponse {
  start_metro: string;
  total_budget_min: number;
  usable_time_min: number;
  total_pandals: number;
  restaurant_break_included: boolean;
  end_preference: string;
  stops: RouteStop[];
}

export default function RoutePlanner({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [metros, setMetros] = useState<MetroStation[]>([]);
  const [searchMetro, setSearchMetro] = useState('');
  const [loadingMetros, setLoadingMetros] = useState(true);

  // Form State
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedMetro, setSelectedMetro] = useState('');
  const [timeBudgetMin, setTimeBudgetMin] = useState<number>(0);
  const [customStartTime, setCustomStartTime] = useState('10:00');
  const [customEndTime, setCustomEndTime] = useState('22:00');
  const [viewingPace, setViewingPace] = useState(7);
  const [restaurantBreak, setRestaurantBreak] = useState(0);
  const [endPreference, setEndPreference] = useState('anywhere');

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<RoutePlanResponse | null>(null);

  useEffect(() => {
    // Load from local JSON data instead of backend API
    const loadMetros = () => {
      try {
        const formattedMetros = metrosData
          .filter((m: any) => m.location?.lat && m.location?.lng)
          .map((m: any) => ({
            name: m.title,
            api_name: m.title,
            address: m.address || '',
            lat: m.location.lat,
            lon: m.location.lng
          }));
        setMetros(formattedMetros);
      } catch (err) {
        console.error("Failed to load metros", err);
      } finally {
        setLoadingMetros(false);
      }
    };
    loadMetros();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const calculateCustomTime = () => {
    if (!customStartTime || !customEndTime) return 360;
    const [startH, startM] = customStartTime.split(':').map(n => Number(n) || 0);
    const [endH, endM] = customEndTime.split(':').map(n => Number(n) || 0);
    if (isNaN(startH) || isNaN(endH)) return 360;
    let startMin = startH * 60 + startM;
    let endMin = endH * 60 + endM;
    if (endMin <= startMin) endMin += 24 * 60; // Next day
    return endMin - startMin;
  };

  const generateRoute = async () => {
    setLoadingRoute(true);
    setStep(7);
    
    let finalBudget = timeBudgetMin;
    if (finalBudget === -1) {
      finalBudget = calculateCustomTime();
    }

    const metro = metros.find(m => m.name === selectedMetro);
    
    try {
      const payload = {
        region: selectedRegion || 'all',
        metro_station_name: selectedMetro || 'Unknown',
        start_lat: Number(metro?.lat) || 0,
        start_lon: Number(metro?.lon) || 0,
        total_minutes: Number(finalBudget) || 120,
        viewing_pace_minutes: Number(viewingPace) || 7,
        restaurant_break_minutes: Number(restaurantBreak) || 0,
        end_preference: endPreference || 'anywhere'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/plan-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setRouteResult(data);
      } else {
        console.error("API error");
        // Mock fallback if API fails
        setRouteResult({
          start_metro: selectedMetro,
          total_budget_min: finalBudget,
          usable_time_min: finalBudget - restaurantBreak,
          total_pandals: 0,
          restaurant_break_included: restaurantBreak > 0,
          end_preference: endPreference,
          stops: []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#FAF6ED] pt-32 pb-12 font-serif text-[#3D0D11] relative z-10 w-full">
      <div className="max-w-2xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#C86040] hover:text-[#8B1E2D] font-bold text-sm bg-white/50 px-4 py-2 rounded-full border border-[#C86040]/20 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            ফিরে যান
          </button>
          
          {step < 7 && (
            <div className="flex gap-2">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${step >= i ? 'bg-[#8B1E2D]' : 'bg-[#E5B05C]/30'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Wizard Steps */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#3D0D11]/5 border border-[#E5B05C]/20 p-8 min-h-[400px]">
          
          {/* Step 1: Region Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-8 h-8 text-[#C86040]" />
                <h2 className="text-3xl font-bold text-[#8B1E2D]">কোন অঞ্চল ঘুরে দেখতে চান?</h2>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-6 font-bold">আপনার পছন্দের এলাকা বেছে নিন যাতে নিকটবর্তী প্যান্ডেল দেখানো যায়:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'north', title: 'উত্তর কলকাতা', desc: 'শ্যামবাজার, শোভাবাজার, হাথিবোগান, বাগবাজার' },
                  { id: 'south', title: 'দক্ষিণ কলকাতা', desc: 'গড়িয়াহাট, মুদিয়ালী, কালীঘাট, চেতলা, একডালিয়া' },
                  { id: 'central', title: 'মধ্য কলকাতা', desc: 'কলেজ স্কয়ার, শিয়ালদহ, ধর্মতলা, সন্তোষ মিত্র স্কয়ার' },
                  { id: 'all', title: 'সমস্ত কলকাতা', desc: 'পুরো কলকাতার জনপ্রিয় প্যান্ডেলসমূহ' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRegion(r.id); handleNext(); }}
                    className={`text-left p-5 rounded-2xl border transition-all ${
                      selectedRegion === r.id 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md' 
                        : 'border-[#E5B05C]/20 hover:border-[#C86040]/50 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <p className="font-bold text-[#8B1E2D] text-xl mb-1">{r.title}</p>
                    <p className="text-xs text-[#3D0D11]/60 font-sans">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Metro Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Navigation className="w-8 h-8 text-[#C86040]" />
                <h2 className="text-3xl font-bold text-[#8B1E2D]">কোন মেট্রো স্টেশন থেকে শুরু করবেন?</h2>
              </div>
              
              <input
                type="text"
                placeholder="মেট্রো স্টেশন খুঁজুন..."
                className="w-full bg-[#FAF6ED] border border-[#E5B05C]/40 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-[#C86040]/50 font-bold"
                value={searchMetro}
                onChange={(e) => setSearchMetro(e.target.value)}
              />

              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {loadingMetros ? (
                  <p className="text-center text-sm text-[#C86040] animate-pulse py-8">মেট্রো স্টেশন খোঁজা হচ্ছে...</p>
                ) : (
                  metros
                    .filter(m => {
                      const matchesSearch = m.name.toLowerCase().includes(searchMetro.toLowerCase());
                      if (!matchesSearch) return false;

                      const mName = m.name.toLowerCase();
                      if (selectedRegion === 'north') {
                        const northKeywords = ["dakshineswar", "baranagar", "noapara", "dum dum", "belgachia", "shyambazar", "shobhabazar", "sovabazar", "girish park", "mahatma gandhi", "m.g. road", "central"];
                        return northKeywords.some(k => {
                          if (k === 'central' && mName.includes('central park')) return false;
                          return mName.includes(k);
                        });
                      } else if (selectedRegion === 'south') {
                        const southKeywords = ["park street", "maidan", "rabindra sadan", "netaji bhavan", "jatin das", "kalighat", "rabindra sarobar", "uttam kumar", "tollygunge", "netaji", "surya sen", "gitanjali", "kavi nazrul", "khudiram", "kavi subhash", "joka", "thakurpukur", "sakherbazar", "behala", "taratala", "majerhat", "ruby", "hemanta"];
                        return southKeywords.some(k => mName.includes(k));
                      } else if (selectedRegion === 'central') {
                        const centralKeywords = ["chandni", "esplanade", "sealdah", "howrah", "mahakaran", "phoolbagan", "salt lake", "bengal chemical", "city centre", "karunamoyee", "sector-v", "sector 5"];
                        return centralKeywords.some(k => mName.includes(k));
                      }
                      return true;
                    })
                    .map(m => (
                    <button
                      key={m.name}
                      onClick={() => { setSelectedMetro(m.name); handleNext(); }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedMetro === m.name 
                          ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md' 
                          : 'border-[#E5B05C]/20 hover:border-[#C86040]/50 hover:bg-[#FAF6ED]'
                      }`}
                    >
                      <p className="font-bold text-[#3D0D11] text-lg">{m.name}</p>
                      <p className="text-xs text-[#3D0D11]/60 mt-1">{m.address}</p>
                    </button>
                  ))
                )}
              </div>
              
              <div className="mt-8 flex justify-between">
                <button onClick={handlePrev} className="text-[#C86040] font-bold text-sm underline underline-offset-4">পিছনে</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8 text-[#C86040]" />
                <h2 className="text-3xl font-bold text-[#8B1E2D]">কতক্ষণ সময় নিয়ে ঘুরবেন?</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[ 
                  { label: "২ ঘণ্টা", min: 120 },
                  { label: "৪ ঘণ্টা", min: 240 },
                  { label: "৬ ঘণ্টা", min: 360 },
                  { label: "৮ ঘণ্টা", min: 480 },
                  { label: "সারাদিন", min: -1 }
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setTimeBudgetMin(opt.min)}
                    className={`p-6 rounded-xl border text-center transition-all ${
                      timeBudgetMin === opt.min 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md scale-105' 
                        : 'border-[#E5B05C]/20 hover:border-[#C86040]/50 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <p className="font-bold text-[#3D0D11] text-xl">{opt.label}</p>
                  </button>
                ))}
              </div>

              {timeBudgetMin === -1 && (
                <div className="mt-6 p-4 bg-[#FAF6ED] rounded-xl border border-[#E5B05C]/30 flex flex-col sm:flex-row gap-4 items-center justify-between animate-in fade-in zoom-in duration-300">
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-[#3D0D11]/70 font-bold mb-1">শুরু</label>
                    <input type="time" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)} className="bg-white border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C86040]" />
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-[#C86040] hidden sm:block" />
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-[#3D0D11]/70 font-bold mb-1">শেষ</label>
                    <input type="time" value={customEndTime} onChange={e => setCustomEndTime(e.target.value)} className="bg-white border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C86040]" />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button onClick={handlePrev} className="text-[#C86040] font-bold text-sm underline underline-offset-4">পিছনে</button>
                <button 
                  onClick={handleNext}
                  disabled={timeBudgetMin === 0}
                  className="bg-[#8B1E2D] text-white px-8 py-3 rounded-full font-bold shadow-lg disabled:opacity-50 hover:bg-[#581318] transition-colors"
                >
                  পরবর্তী ধাপ
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-8 h-8 text-[#C86040]" />
                <h2 className="text-3xl font-bold text-[#8B1E2D]">প্রতি পুজোয় কতক্ষণ সময় দিতে চান?</h2>
              </div>

              <div className="space-y-4">
                {[ 
                  { label: "দ্রুত ঘুরব", desc: "~৫ মিনিট প্রতি মণ্ডপ (বেশি প্যান্ডেল)", min: 5 },
                  { label: "স্বাভাবিকভাবে ঘুরব", desc: "~৭ মিনিট প্রতি মণ্ডপ (ব্যালেন্সড)", min: 7 },
                  { label: "সময় নিয়ে ঘুরব", desc: "~১২ মিনিট প্রতি মণ্ডপ (ছবি তোলা ও ভিড়)", min: 12 },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setViewingPace(opt.min)}
                    className={`w-full p-5 rounded-xl border text-left transition-all ${
                      viewingPace === opt.min 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md' 
                        : 'border-[#E5B05C]/20 hover:border-[#C86040]/50 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <p className="font-bold text-[#3D0D11] text-xl mb-1">{opt.label}</p>
                    <p className="text-sm text-[#3D0D11]/70">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={handlePrev} className="text-[#C86040] font-bold text-sm underline underline-offset-4">পিছনে</button>
                <button onClick={handleNext} className="bg-[#8B1E2D] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#581318] transition-colors">
                  পরবর্তী ধাপ
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Coffee className="w-8 h-8 text-[#C86040]" />
                <h2 className="text-3xl font-bold text-[#8B1E2D]">মাঝে কি রেস্টুরেন্টে খাবেন?</h2>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-6 font-bold">হ্যাঁ বললে, রুট থেকে ৯০ মিনিট সময় খাবারের জন্য সরিয়ে রাখা হবে।</p>

              <div className="grid grid-cols-2 gap-4">
                {[ 
                  { label: "না", min: 0 },
                  { label: "হ্যাঁ", min: 90 },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setRestaurantBreak(opt.min)}
                    className={`p-6 rounded-xl border text-center transition-all ${
                      restaurantBreak === opt.min 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md scale-105' 
                        : 'border-[#E5B05C]/20 hover:border-[#C86040]/50 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <p className="font-bold text-[#3D0D11] text-xl">{opt.label}</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={handlePrev} className="text-[#C86040] font-bold text-sm underline underline-offset-4">পিছনে</button>
                <button onClick={handleNext} className="bg-[#8B1E2D] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#581318] transition-colors">
                  পরবর্তী ধাপ
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-[#C86040]" />
                <h2 className="text-3xl font-bold text-[#8B1E2D]">কোথায় রুট শেষ করতে চান?</h2>
              </div>

              <div className="space-y-4">
                {[ 
                  { label: "যেকোনো সুবিধাজনক জায়গায়", val: 'anywhere' },
                  { label: "নিকটবর্তী মেট্রো স্টেশনে", val: 'nearest_metro' },
                  { label: "যে মেট্রো থেকে শুরু করেছি", val: 'start_metro' },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setEndPreference(opt.val)}
                    className={`w-full p-5 rounded-xl border text-left transition-all ${
                      endPreference === opt.val 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md' 
                        : 'border-[#E5B05C]/20 hover:border-[#C86040]/50 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <p className="font-bold text-[#3D0D11] text-lg">{opt.label}</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={handlePrev} className="text-[#C86040] font-bold text-sm underline underline-offset-4">পিছনে</button>
                <button onClick={generateRoute} className="bg-[#8B1E2D] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#581318] transition-colors flex items-center gap-2">
                  রুট তৈরি করুন <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="animate-in fade-in duration-500">
              {loadingRoute ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-[#E5B05C]/30 border-t-[#8B1E2D] rounded-full animate-spin mb-6"></div>
                  <h3 className="text-2xl font-bold text-[#8B1E2D] animate-pulse">আপনার পুজো রুট তৈরি হচ্ছে...</h3>
                  <p className="text-sm text-[#3D0D11]/60 mt-2 font-bold">দূরত্ব এবং সময় গণনা করা হচ্ছে...</p>
                </div>
              ) : routeResult ? (
                <div className="space-y-6">
                  {/* Result Header */}
                  <div className="bg-[#FAF6ED] p-6 rounded-2xl border border-[#E5B05C]/30 text-center shadow-inner">
                    <h2 className="text-3xl font-bold text-[#8B1E2D] mb-2">আপনার পুজো পরিক্রমা</h2>
                    <p className="text-sm font-bold text-[#3D0D11]/70">
                      শুরু: <span className="text-[#C86040]">{routeResult.start_metro}</span>
                    </p>
                    <div className="flex justify-center gap-4 mt-4">
                      <div className="bg-white px-4 py-3 rounded-xl border border-[#E5B05C]/20 shadow-sm w-24">
                        <span className="block text-3xl font-bold text-[#3D0D11]">{routeResult.total_pandals}</span>
                        <span className="text-[10px] text-[#3D0D11]/60 font-bold uppercase tracking-widest">প্যান্ডেল</span>
                      </div>
                      <div className="bg-white px-4 py-3 rounded-xl border border-[#E5B05C]/20 shadow-sm w-24">
                        <span className="block text-3xl font-bold text-[#3D0D11]">{Math.floor(routeResult.total_budget_min / 60)}ঘ</span>
                        <span className="text-[10px] text-[#3D0D11]/60 font-bold uppercase tracking-widest">সময়</span>
                      </div>
                    </div>
                  </div>

                  {/* Route Timeline */}
                  {routeResult.stops.length > 0 ? (
                    <div className="relative pl-8 border-l-2 border-dashed border-[#E5B05C]/40 space-y-8 my-10 ml-2">
                      {routeResult.stops.map((stop, idx) => (
                        <div key={idx} className="relative">
                          {/* Number Dot */}
                          <div className="absolute w-8 h-8 bg-[#8B1E2D] rounded-full -left-[49px] top-0 border-4 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                            {idx + 1}
                          </div>
                          
                          <div className="bg-white p-5 rounded-xl border border-[#E5B05C]/20 shadow-sm relative -top-2">
                            <h4 className="text-xl font-bold text-[#3D0D11] mb-1 leading-tight">{stop.name}</h4>
                            <p className="text-xs text-[#3D0D11]/60 mb-4">{stop.address}</p>
                            
                            <div className="flex flex-wrap gap-3 text-[11px] font-bold text-[#C86040]">
                              <span className="flex items-center gap-1.5 bg-[#FAF6ED] px-2.5 py-1.5 rounded-lg border border-[#C86040]/10">
                                <Navigation className="w-3.5 h-3.5" />
                                হাটা: ~{stop.estimated_travel_min} মি
                              </span>
                              <span className="flex items-center gap-1.5 bg-[#FAF6ED] px-2.5 py-1.5 rounded-lg border border-[#C86040]/10">
                                <Clock className="w-3.5 h-3.5" />
                                মোট সময়: {Math.floor(stop.cumulative_time_min / 60)}ঘ {stop.cumulative_time_min % 60}মি
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-[#8B1E2D] font-bold text-lg">দুঃখিত, এই মেট্রো স্টেশনের আশেপাশে প্রদত্ত সময়ের মধ্যে কোন প্যান্ডেল পাওয়া যায় নি।</p>
                    </div>
                  )}

                  {/* Footer Notice */}
                  <div className="bg-[#8B1E2D]/5 p-5 rounded-xl border border-[#8B1E2D]/20">
                    <p className="text-xs text-[#8B1E2D] leading-relaxed font-bold">
                      * দ্রষ্টব্য: ভিড়ের জন্য হাঁটার সময় ১.৫ গুণ + ৩ মিনিট যোগ করে হিসাব করা হয়েছে। আপনার সুরক্ষার জন্য কিছু সময় অতিরিক্ত বাফার হিসেবে রাখা আছে।
                    </p>
                  </div>

                  <button 
                    onClick={() => { setStep(1); setRouteResult(null); }}
                    className="w-full bg-white text-[#8B1E2D] border-2 border-[#8B1E2D] px-8 py-3.5 rounded-full font-bold shadow-sm hover:bg-[#8B1E2D] hover:text-white transition-colors mt-4"
                  >
                    আবার পরিকল্পনা করুন
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
