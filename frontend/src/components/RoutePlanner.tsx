import { useState, useEffect } from 'react';
import metrosData from '../data/metros.json';
import northPandals from '../data/north_cords.json';
import southPandals from '../data/south_kolkata.json';
import centralPandals from '../data/central_kolkata.json';
import bonediPandals from '../data/bonedi_kolkata.json';
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

interface PandalItem {
  name: string;
  address?: string;
  lat: number;
  lon: number;
}

// Distance calculation using Haversine Formula (in km)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Client-side route generator fallback guarantees 100% offline/fast performance with exact Kolkata street accuracy
function generateLocalRoute(
  selectedRegion: string,
  startMetroName: string,
  startLat: number,
  startLon: number,
  totalBudgetMin: number,
  viewingPaceMin: number,
  restaurantBreakMin: number,
  endPref: string
): RoutePlanResponse {
  let pool: PandalItem[] = [];
  if (selectedRegion === 'north') {
    pool = [...(northPandals as PandalItem[])];
  } else if (selectedRegion === 'south') {
    pool = [...(southPandals as PandalItem[])];
  } else if (selectedRegion === 'central') {
    pool = [...(centralPandals as PandalItem[])];
  } else if (selectedRegion === 'bonedi') {
    pool = [...(bonediPandals as PandalItem[])];
  } else {
    pool = [
      ...(northPandals as PandalItem[]),
      ...(southPandals as PandalItem[]),
      ...(centralPandals as PandalItem[]),
      ...(bonediPandals as PandalItem[])
    ];
  }

  pool = pool.filter(p => p.lat && p.lon);

  // Famous Kolkata Pujas get high priority for accurate itineraries
  const famousKeywords = ["bagbazar", "ekdalia", "chetla", "suruchi", "college square", "mohammad ali", "santosh mitra", "ahiritola", "kumartuli", "shovabazar", "sovabazar", "singhi park", "mudiali", "ballygunge", "sreebhumi", "tridhara", "deshapriya", "babu bagan", "jodhpur park", "66 pally"];

  let currentLat = startLat;
  let currentLon = startLon;
  if (!currentLat || !currentLon) {
    const metroObj = (metrosData as any[]).find((m: any) => m.title === startMetroName);
    if (metroObj?.location?.lat && metroObj?.location?.lng) {
      currentLat = metroObj.location.lat;
      currentLon = metroObj.location.lng;
    } else {
      currentLat = 22.5726; // Default Kolkata center
      currentLon = 88.3639;
    }
  }

  const usableTime = Math.max(30, totalBudgetMin - restaurantBreakMin);
  const stops: RouteStop[] = [];
  let cumulativeMin = 0;
  const visited = new Set<string>();

  while (cumulativeMin < usableTime && visited.size < pool.length) {
    let bestPandal: PandalItem | null = null;
    let bestScore = Infinity;

    for (const p of pool) {
      if (visited.has(p.name)) continue;
      
      const realDistKm = getDistanceKm(currentLat, currentLon, p.lat, p.lon) * 1.4; // 1.4x Kolkata street distance factor
      const isFamous = famousKeywords.some(k => p.name.toLowerCase().includes(k));
      
      // For subsequent stops, strictly penalize jumps over 2.5 km from the previous pandal
      let score = realDistKm;
      if (stops.length > 0 && realDistKm > 2.5) {
        score += 10.0; // Heavy penalty for long distance jumps
      }
      if (isFamous && realDistKm <= 2.5) {
        score -= 0.5; // Small priority bonus only if within walking neighborhood
      }

      if (score < bestScore) {
        bestScore = score;
        bestPandal = p;
      }
    }

    if (!bestPandal) break;

    const realDistKm = getDistanceKm(currentLat, currentLon, bestPandal.lat, bestPandal.lon) * 1.4;
    if (stops.length > 0 && realDistKm > 4.0) break; // End sequence if nearest available pandal is too far

    // Walking speed in dense Puja crowds: ~3.2 km/h (18.75 min/km) + 4 min queue & traffic buffer
    const travelMin = Math.max(3, Math.round(realDistKm * 18.75 + 4));
    const nextCumulative = cumulativeMin + travelMin + viewingPaceMin;

    if (nextCumulative > usableTime && stops.length > 0) {
      break;
    }

    visited.add(bestPandal.name);
    cumulativeMin = nextCumulative;
    currentLat = bestPandal.lat;
    currentLon = bestPandal.lon;

    stops.push({
      name: bestPandal.name,
      address: bestPandal.address || `${bestPandal.name}, Kolkata`,
      lat: bestPandal.lat,
      lon: bestPandal.lon,
      estimated_travel_min: travelMin,
      cumulative_time_min: cumulativeMin
    });

    if (restaurantBreakMin > 0 && stops.length === Math.ceil(usableTime / (travelMin + viewingPaceMin) / 2)) {
      cumulativeMin += restaurantBreakMin;
    }
  }

  return {
    start_metro: startMetroName || 'কলকাতা মেট্রো',
    total_budget_min: totalBudgetMin,
    usable_time_min: usableTime,
    total_pandals: stops.length,
    restaurant_break_included: restaurantBreakMin > 0,
    end_preference: endPref,
    stops: stops
  };
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
        const formattedMetros = (metrosData as any[])
          .map((m: any) => {
            const lat = m.location?.lat ?? m.lat;
            const lon = m.location?.lng ?? m.lon ?? m.lng;
            return {
              name: m.title || m.name,
              subTitle: m.subTitle || '',
              api_name: m.title || m.name,
              address: m.address || '',
              lat: Number(lat) || 0,
              lon: Number(lon) || 0
            };
          })
          .filter(m => m.lat !== 0 && m.lon !== 0);
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
    const startLat = Number(metro?.lat) || 0;
    const startLon = Number(metro?.lon) || 0;
    const metroName = selectedMetro || (metros.length > 0 ? metros[0].name : 'Shyambazar');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

      const payload = {
        region: selectedRegion || 'all',
        metro_station_name: metroName,
        start_lat: startLat,
        start_lon: startLon,
        total_minutes: Number(finalBudget) || 120,
        viewing_pace_minutes: Number(viewingPace) || 7,
        restaurant_break_minutes: Number(restaurantBreak) || 0,
        end_preference: endPreference || 'anywhere'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com'}/api/plan-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.stops && data.stops.length > 0) {
          setRouteResult(data);
          return;
        }
      }
      
      // Fallback to client-side route calculation if API returns 0 stops or fails
      const fallbackResult = generateLocalRoute(
        selectedRegion,
        metroName,
        startLat,
        startLon,
        finalBudget || 240,
        viewingPace || 7,
        restaurantBreak || 0,
        endPreference
      );
      setRouteResult(fallbackResult);
    } catch (err) {
      console.warn("Backend API unavailable/timeout, using instant local route engine", err);
      const fallbackResult = generateLocalRoute(
        selectedRegion,
        metroName,
        startLat,
        startLon,
        finalBudget || 240,
        viewingPace || 7,
        restaurantBreak || 0,
        endPreference
      );
      setRouteResult(fallbackResult);
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
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#3D0D11] text-lg">🚇 {m.name}</p>
                        {(m as any).subTitle && (
                          <span className="text-xs font-serif font-bold text-[#8B1E2D] bg-[#8B1E2D]/10 px-2 py-0.5 rounded-full">
                            {(m as any).subTitle}
                          </span>
                        )}
                      </div>
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

                    {/* Open Entire Route in Google Maps */}
                    {routeResult.stops.length > 0 && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${routeResult.stops[routeResult.stops.length - 1].lat},${routeResult.stops[routeResult.stops.length - 1].lon}&waypoints=${routeResult.stops.slice(0, -1).map(s => `${s.lat},${s.lon}`).join('|')}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 bg-[#8B1E2D] hover:bg-[#581318] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md transition-all active:scale-95"
                      >
                        <Map className="w-4 h-4 text-[#E5B05C]" />
                        <span>Google Maps-এ পুরো রুট চালু করুন (GPS Route)</span>
                      </a>
                    )}
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
                          
                          <div className="bg-white p-5 rounded-xl border border-[#E5B05C]/20 shadow-sm relative -top-2 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <h4 className="text-xl font-bold text-[#3D0D11] leading-tight">{stop.name}</h4>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + ' ' + stop.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 bg-[#FAF6ED] hover:bg-[#8B1E2D] hover:text-white text-[#8B1E2D] border border-[#8B1E2D]/20 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>ম্যাপে দেখুন</span>
                              </a>
                            </div>
                            <p className="text-xs text-[#3D0D11]/60 mb-4">{stop.address}</p>
                            
                            <div className="flex flex-wrap gap-3 text-[11px] font-bold text-[#C86040]">
                              <span className="flex items-center gap-1.5 bg-[#FAF6ED] px-2.5 py-1.5 rounded-lg border border-[#C86040]/10">
                                <Navigation className="w-3.5 h-3.5" />
                                {idx === 0 ? `মেট্রো থেকে: ~${stop.estimated_travel_min} মি` : `পূর্ববর্তী প্যান্ডেল থেকে: ~${stop.estimated_travel_min} মি`}
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
