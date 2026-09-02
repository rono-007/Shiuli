import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Map as MapIcon, Clock, Zap, Coffee, CheckCircle, MapPin, Navigation, Compass, Layers, RotateCcw } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLanguage } from '../context/LanguageContext';

interface MetroStation {
  name: string;
  api_name?: string;
  line?: string;
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
  is_food_break?: boolean;
  is_metro?: boolean;
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

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

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

// In-memory module caches to avoid repeated network transfer on re-generation
const regionPandalsCache: Record<string, PandalItem[]> = {};
let metroStationsCache: MetroStation[] | null = null;

// Client-side intelligent route generator guarantees 100% offline & fast performance with Kolkata neighborhood logic
async function generateLocalRoute(
  selectedRegion: string,
  startMetroName: string,
  startLat: number,
  startLon: number,
  totalBudgetMin: number,
  viewingPaceMin: number,
  restaurantBreakMin: number,
  endPref: string,
  allMetros: MetroStation[]
): Promise<RoutePlanResponse> {
  
  // Fetch required region data on demand
  const regionsToLoad = selectedRegion === 'all' 
    ? ['north', 'south', 'central', 'bonedi'] 
    : [selectedRegion];
    
  let pool: PandalItem[] = [];
  
  for (const region of regionsToLoad) {
    if (regionPandalsCache[region]) {
      pool = [...pool, ...regionPandalsCache[region]];
      continue;
    }
    try {
      const res = await fetch(`/data/${region}_pandals.json`);
      if (res.ok) {
        const data = await res.json();
        regionPandalsCache[region] = data;
        pool = [...pool, ...data];
      }
    } catch (e) {
      console.warn(`Failed to load ${region} pandals for routing`, e);
    }
  }

  pool = pool.filter(p => p.lat && p.lon);

  // Famous Kolkata Pujas get high priority for accurate itineraries
  const famousKeywords = ["bagbazar", "ekdalia", "chetla", "suruchi", "college square", "mohammad ali", "santosh mitra", "ahiritola", "kumartuli", "shovabazar", "sovabazar", "singhi park", "mudiali", "ballygunge", "sreebhumi", "tridhara", "deshapriya", "babu bagan", "jodhpur park", "66 pally"];

  let currentLat = startLat || 22.5726;
  let currentLon = startLon || 88.3639;

  // Buffer time reserved for end transit / buffer
  const safetyBuffer = totalBudgetMin <= 120 ? 15 : totalBudgetMin <= 240 ? 25 : 40;
  const usableTime = Math.max(30, totalBudgetMin - restaurantBreakMin - safetyBuffer);
  
  const stops: RouteStop[] = [];
  let cumulativeMin = 0;
  const visited = new Set<string>();

  // Add initial start metro point
  let lastLat = currentLat;
  let lastLon = currentLon;

  while (cumulativeMin < usableTime && visited.size < pool.length) {
    let bestPandal: PandalItem | null = null;
    let bestScore = Infinity;

    for (const p of pool) {
      if (visited.has(p.name)) continue;
      
      const realDistKm = getDistanceKm(currentLat, currentLon, p.lat, p.lon) * 1.35; // Kolkata pedestrian detour factor
      const isFamous = famousKeywords.some(k => p.name.toLowerCase().includes(k));
      
      // For subsequent stops, strictly penalize large jumps
      let score = realDistKm;
      if (stops.length > 0 && realDistKm > 2.2) {
        score += 8.0; // Penalty for jumps across distant neighborhoods
      }
      if (isFamous && realDistKm <= 2.5) {
        score -= 0.6; // Priority bonus for famous landmark pandals in same cluster
      }

      if (score < bestScore) {
        bestScore = score;
        bestPandal = p;
      }
    }

    if (!bestPandal) break;

    const realDistKm = getDistanceKm(currentLat, currentLon, bestPandal.lat, bestPandal.lon) * 1.35;
    if (stops.length > 0 && realDistKm > 3.8) break; // Break if next pandal is too isolated

    // Walking speed in dense Puja crowds: ~3.2 km/h (18.75 min/km) + 3 min queue & entrance buffer
    const travelMin = Math.max(3, Math.round(realDistKm * 18.75 + 3));
    const nextCumulative = cumulativeMin + travelMin + viewingPaceMin;

    if (nextCumulative > usableTime && stops.length > 0) {
      break;
    }

    visited.add(bestPandal.name);
    cumulativeMin = nextCumulative;
    currentLat = bestPandal.lat;
    currentLon = bestPandal.lon;
    lastLat = currentLat;
    lastLon = currentLon;

    stops.push({
      name: bestPandal.name,
      address: bestPandal.address || `${bestPandal.name}, Kolkata`,
      lat: bestPandal.lat,
      lon: bestPandal.lon,
      estimated_travel_min: travelMin,
      cumulative_time_min: cumulativeMin
    });

    // Insert food break in the middle
    if (restaurantBreakMin > 0 && stops.length === Math.ceil(usableTime / (travelMin + viewingPaceMin) / 2)) {
      cumulativeMin += restaurantBreakMin;
    }
  }

  // Handle End Preferences (return to metro or nearest metro)
  if (endPref === 'start_metro' && stops.length > 0 && startLat && startLon) {
    const returnDist = getDistanceKm(lastLat, lastLon, startLat, startLon) * 1.35;
    const returnTime = Math.max(5, Math.round(returnDist * 18.75 + 5));
    cumulativeMin += returnTime;
    stops.push({
      name: `${startMetroName} (প্রস্থান / Exit)`,
      address: `প্রারম্ভিক মেট্রো স্টেশনে প্রত্যাবর্তন`,
      lat: startLat,
      lon: startLon,
      estimated_travel_min: returnTime,
      cumulative_time_min: cumulativeMin,
      is_metro: true
    });
  } else if (endPref === 'nearest_metro' && stops.length > 0 && allMetros.length > 0) {
    let nearestMetro = allMetros[0];
    let minDist = Infinity;
    for (const m of allMetros) {
      if (!m.lat || !m.lon) continue;
      const d = getDistanceKm(lastLat, lastLon, m.lat, m.lon);
      if (d < minDist) {
        minDist = d;
        nearestMetro = m;
      }
    }
    const metroTravelMin = Math.max(4, Math.round(minDist * 1.35 * 18.75 + 3));
    cumulativeMin += metroTravelMin;
    stops.push({
      name: `${nearestMetro.name} Metro Station (সমাপ্তি / End)`,
      address: nearestMetro.address || `নিকটবর্তী মেট্রো স্টেশন`,
      lat: nearestMetro.lat,
      lon: nearestMetro.lon,
      estimated_travel_min: metroTravelMin,
      cumulative_time_min: cumulativeMin,
      is_metro: true
    });
  }

  return {
    start_metro: startMetroName || 'কলকাতা মেট্রো',
    total_budget_min: totalBudgetMin,
    usable_time_min: cumulativeMin,
    total_pandals: stops.filter(s => !s.is_metro).length,
    restaurant_break_included: restaurantBreakMin > 0,
    end_preference: endPref,
    stops: stops
  };
}

export default function RoutePlanner({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [metros, setMetros] = useState<MetroStation[]>([]);
  const [searchMetro, setSearchMetro] = useState('');
  const [loadingMetros, setLoadingMetros] = useState(true);

  // Form State
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedMetro, setSelectedMetro] = useState('');
  const [timeBudgetMin, setTimeBudgetMin] = useState<number>(240);
  const [customStartTime, setCustomStartTime] = useState('14:00');
  const [customEndTime, setCustomEndTime] = useState('20:00');
  const [viewingPace, setViewingPace] = useState(7);
  const [restaurantBreak, setRestaurantBreak] = useState(0);
  const [endPreference, setEndPreference] = useState('anywhere');

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<RoutePlanResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'timeline'>('map');

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    // Reuse cached metro stations list if available
    if (metroStationsCache) {
      setMetros(metroStationsCache);
      setLoadingMetros(false);
      return;
    }
    const loadMetros = async () => {
      try {
        const res = await fetch('/data/metro_stations.json');
        if (res.ok) {
          const data = await res.json();
          metroStationsCache = data as MetroStation[];
          setMetros(metroStationsCache);
        }
      } catch (err) {
        console.error("Failed to load metro stations", err);
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
    const startLat = Number(metro?.lat) || 22.5726;
    const startLon = Number(metro?.lon) || 88.3639;
    const metroName = selectedMetro || (metros.length > 0 ? metros[0].name : 'Shyambazar');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for fast response

      const payload = {
        region: selectedRegion || 'all',
        metro_station_name: metroName,
        start_lat: startLat,
        start_lon: startLon,
        total_minutes: Number(finalBudget) || 240,
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
          let updatedStops = [...data.stops];
          
          // Check if ending metro is needed but missing from backend response
          const hasEndingMetro = updatedStops.some((s, idx) => idx === updatedStops.length - 1 && (s.name.includes('Metro') || s.name.includes('মেট্রো') || s.name.includes('সমাপ্তি') || s.name.includes('প্রত্যাবর্তন')));

          if (!hasEndingMetro && endPreference === 'start_metro' && startLat && startLon) {
            const lastStop = updatedStops[updatedStops.length - 1];
            const returnDist = getDistanceKm(lastStop.lat, lastStop.lon, startLat, startLon) * 1.35;
            const returnTime = Math.max(4, Math.round(returnDist * 18.75 + 4));
            updatedStops.push({
              name: `${metroName} (প্রারম্ভিক মেট্রো প্রত্যাবর্তন)`,
              address: `প্রারম্ভিক মেট্রো স্টেশনে প্রত্যাবর্তন ও সমাপ্তি`,
              lat: startLat,
              lon: startLon,
              estimated_travel_min: returnTime,
              cumulative_time_min: lastStop.cumulative_time_min + returnTime,
              is_metro: true
            });
          } else if (!hasEndingMetro && endPreference === 'nearest_metro' && metros.length > 0) {
            const lastStop = updatedStops[updatedStops.length - 1];
            let nearestMetro = metros[0];
            let minDist = Infinity;
            for (const m of metros) {
              if (!m.lat || !m.lon) continue;
              const d = getDistanceKm(lastStop.lat, lastStop.lon, m.lat, m.lon);
              if (d < minDist) {
                minDist = d;
                nearestMetro = m;
              }
            }
            const metroTravelMin = Math.max(4, Math.round(minDist * 1.35 * 18.75 + 3));
            updatedStops.push({
              name: `${nearestMetro.name} Metro Station (সমাপ্তি / End)`,
              address: nearestMetro.address || `নিকটবর্তী মেট্রো স্টেশন (${nearestMetro.line || ''})`,
              lat: nearestMetro.lat,
              lon: nearestMetro.lon,
              estimated_travel_min: metroTravelMin,
              cumulative_time_min: lastStop.cumulative_time_min + metroTravelMin,
              is_metro: true
            });
          }

          const processedStops = updatedStops.map((s, idx) => {
            const isLast = idx === updatedStops.length - 1;
            const isMetroStop = s.name.includes('Metro') || s.name.includes('মেট্রো') || s.name.includes('সমাপ্তি') || s.name.includes('প্রত্যাবর্তন') || (isLast && endPreference !== 'anywhere');
            return {
              ...s,
              is_metro: isMetroStop
            };
          });

          setRouteResult({
            ...data,
            usable_time_min: processedStops[processedStops.length - 1]?.cumulative_time_min || data.usable_time_min,
            total_pandals: processedStops.filter(s => !s.is_metro).length,
            stops: processedStops
          });
          return;
        }
      }
      
      // Fallback to client-side high accuracy route generator
      const fallbackResult = await generateLocalRoute(
        selectedRegion,
        metroName,
        startLat,
        startLon,
        finalBudget || 240,
        viewingPace || 7,
        restaurantBreak || 0,
        endPreference,
        metros
      );
      setRouteResult(fallbackResult);
    } catch (err) {
      console.warn("Backend routing offline/slow, generating local optimized route", err);
      const fallbackResult = await generateLocalRoute(
        selectedRegion,
        metroName,
        startLat,
        startLon,
        finalBudget || 240,
        viewingPace || 7,
        restaurantBreak || 0,
        endPreference,
        metros
      );
      setRouteResult(fallbackResult);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Render Interactive Map in Step 7
  useEffect(() => {
    if (step !== 7 || !routeResult || !mapContainerRef.current || routeResult.stops.length === 0) return;

    // Clean up previous map if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startMetro = metros.find(m => m.name === selectedMetro);
    const startLat = startMetro?.lat || (routeResult.stops[0] ? routeResult.stops[0].lat : 22.5726);
    const startLon = startMetro?.lon || (routeResult.stops[0] ? routeResult.stops[0].lon : 88.3639);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [startLon, startLat],
      zoom: 13.5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');

    map.on('load', () => {
      // Build route coordinates array
      const allCoords: [number, number][] = [];

      // Add Start Metro coordinate
      allCoords.push([startLon, startLat]);

      // Add start metro marker
      const startEl = document.createElement('div');
      startEl.className = 'w-9 h-9 rounded-full bg-[#1E3A8A] text-white border-2 border-white shadow-xl flex items-center justify-center font-bold text-sm cursor-pointer transform hover:scale-110 transition-transform';
      startEl.innerHTML = '🚇';
      new maplibregl.Marker({ element: startEl })
        .setLngLat([startLon, startLat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`<div class="p-2 font-serif text-[#3D0D11]"><strong>🚇 শুরু: ${selectedMetro || 'মেট্রো স্টেশন'}</strong><br/><span class="text-xs text-gray-600">${startMetro?.address || 'প্রারম্ভিক বিন্দু'}</span></div>`))
        .addTo(map);

      // Add each stop coordinate and custom numbered marker
      routeResult.stops.forEach((stop, index) => {
        allCoords.push([stop.lon, stop.lat]);

        const markerEl = document.createElement('div');
        markerEl.className = stop.is_metro 
          ? 'w-9 h-9 rounded-full bg-[#1E3A8A] text-white border-2 border-white shadow-xl flex items-center justify-center font-bold text-sm cursor-pointer'
          : 'w-8 h-8 rounded-full bg-[#8B1E2D] text-white border-2 border-[#E5B05C] shadow-lg flex items-center justify-center font-bold text-xs cursor-pointer transform hover:scale-125 transition-transform';
        
        markerEl.innerHTML = stop.is_metro ? '🚇' : `${index + 1}`;

        new maplibregl.Marker({ element: markerEl })
          .setLngLat([stop.lon, stop.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 12 }).setHTML(`
              <div class="p-2.5 font-serif text-[#3D0D11] max-w-[220px]">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#8B1E2D] bg-[#8B1E2D]/10 px-2 py-0.5 rounded-full mb-1 inline-block">ধাপ ${index + 1}</span>
                <h4 class="font-bold text-sm mb-1">${stop.name}</h4>
                <p class="text-[11px] text-gray-600 mb-2">${stop.address}</p>
                <div class="text-[10px] text-[#C86040] font-bold">
                  🚶 হাঁটার সময়: ~${stop.estimated_travel_min} মিনিট<br/>
                  ⏱️ মোট সময়: ${Math.floor(stop.cumulative_time_min / 60)}ঘ ${stop.cumulative_time_min % 60}মি
                </div>
              </div>
            `)
          )
          .addTo(map);
      });

      // Add Route Line GeoJSON source and glowing layer
      map.addSource('puja-route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: allCoords,
          },
        },
      });

      // Outer glow line
      map.addLayer({
        id: 'puja-route-glow',
        type: 'line',
        source: 'puja-route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#E5B05C',
          'line-width': 7,
          'line-opacity': 0.6,
        },
      });

      // Core route path
      map.addLayer({
        id: 'puja-route-path',
        type: 'line',
        source: 'puja-route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#8B1E2D',
          'line-width': 4,
          'line-dasharray': [1.5, 1],
        },
      });

      // Fit bounds to enclose all route coordinates comfortably
      const bounds = new maplibregl.LngLatBounds();
      allCoords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, maxZoom: 15.5 });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, [step, routeResult]);

  // Construct Google Maps Turn-by-Turn GPS Directions Link
  const getGoogleMapsRouteUrl = () => {
    if (!routeResult || routeResult.stops.length === 0) return '#';
    const startMetro = metros.find(m => m.name === selectedMetro);
    const startCoord = startMetro ? `${startMetro.lat},${startMetro.lon}` : `${routeResult.stops[0].lat},${routeResult.stops[0].lon}`;
    const destination = `${routeResult.stops[routeResult.stops.length - 1].lat},${routeResult.stops[routeResult.stops.length - 1].lon}`;
    
    // Middle waypoints (up to 9 for standard Google Maps URL)
    const waypoints = routeResult.stops
      .slice(0, -1)
      .map(s => `${s.lat},${s.lon}`)
      .slice(0, 8)
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${startCoord}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
  };

  return (
    <div className="min-h-[85vh] bg-[#FAF6ED] pt-28 pb-16 font-serif text-[#3D0D11] relative z-10 w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#C86040] hover:text-[#8B1E2D] font-bold text-sm bg-white/80 px-4 py-2 rounded-full border border-[#C86040]/20 shadow-sm transition-all hover:bg-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.rpBack}
          </button>
          
          {step < 7 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B1E2D] mr-1">{t.rpStep} {step}/৬</span>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-[#8B1E2D]' : step > i ? 'w-4 bg-[#C86040]' : 'w-2 bg-[#E5B05C]/30'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#3D0D11]/5 border border-[#E5B05C]/30 p-6 sm:p-10 min-h-[420px]">
          
          {/* Step 1: Region Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-8 h-8 text-[#8B1E2D]" />
                <h1 className="text-2xl sm:text-3xl font-bold text-[#8B1E2D]">{t.rpRegionTitle}</h1>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-8 font-sans font-medium">{t.rpRegionSubtitle}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'north', title: t.rpRegionNorthTitle, desc: t.rpRegionNorthDesc, icon: '🏛️' },
                  { id: 'south', title: t.rpRegionSouthTitle, desc: t.rpRegionSouthDesc, icon: '🌸' },
                  { id: 'central', title: t.rpRegionCentralTitle, desc: t.rpRegionCentralDesc, icon: '✨' },
                  { id: 'all', title: t.rpRegionAllTitle, desc: t.rpRegionAllDesc, icon: '🗺️' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRegion(r.id); handleNext(); }}
                    className={`text-left p-6 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      selectedRegion === r.id 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md scale-[1.01]' 
                        : 'border-[#E5B05C]/30 hover:border-[#C86040] hover:bg-[#FAF6ED]/60'
                    }`}
                  >
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <p className="font-bold text-[#8B1E2D] text-xl mb-1">{r.title}</p>
                    <p className="text-xs text-[#3D0D11]/70 font-sans leading-relaxed">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Metro Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <Navigation className="w-8 h-8 text-[#8B1E2D]" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#8B1E2D]">{t.rpMetroTitle}</h2>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-6 font-sans font-medium">{t.rpMetroSubtitle}</p>
              
              <input
                type="text"
                placeholder={t.rpMetroSearchPlaceholder}
                className="w-full bg-[#FAF6ED] border border-[#E5B05C]/40 rounded-xl px-4 py-3.5 mb-5 focus:outline-none focus:ring-2 focus:ring-[#8B1E2D]/40 font-sans text-sm"
                value={searchMetro}
                onChange={(e) => setSearchMetro(e.target.value)}
              />

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {loadingMetros ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-[#8B1E2D] border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-xs text-[#8B1E2D] font-bold">{t.rpMetroLoading}</p>
                  </div>
                ) : (
                  metros
                    .filter(m => {
                      const matchesSearch = (m.name || '').toLowerCase().includes(searchMetro.toLowerCase()) || 
                                            (m.address || '').toLowerCase().includes(searchMetro.toLowerCase()) ||
                                            (m.line || '').toLowerCase().includes(searchMetro.toLowerCase());
                      if (!matchesSearch) return false;

                      const mName = (m.name || '').toLowerCase();
                      if (selectedRegion === 'north') {
                        const northKeywords = ["dakshineswar", "baranagar", "noapara", "dum dum", "belgachia", "shyambazar", "shobhabazar", "girish park", "mahatma gandhi", "central", "cantonment", "jessore", "airport"];
                        return northKeywords.some(k => mName.includes(k));
                      } else if (selectedRegion === 'south') {
                        const southKeywords = ["park street", "maidan", "rabindra sadan", "netaji bhavan", "jatin das", "kalighat", "rabindra sarobar", "uttam kumar", "tollygunge", "netaji", "surya sen", "gitanjali", "kavi nazrul", "khudiram", "kavi subhash", "joka", "thakurpukur", "sakherbazar", "behala", "taratala", "majerhat", "ruby", "hemanta", "satyajit", "sukanta"];
                        return southKeywords.some(k => mName.includes(k));
                      } else if (selectedRegion === 'central') {
                        const centralKeywords = ["chandni", "esplanade", "sealdah", "howrah", "mahakaran", "phoolbagan", "salt lake", "bengal chemical", "city centre", "karunamoyee", "sector-v"];
                        return centralKeywords.some(k => mName.includes(k));
                      }
                      return true;
                    })
                    .map(m => (
                    <button
                      key={m.name}
                      onClick={() => { setSelectedMetro(m.name); handleNext(); }}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                        selectedMetro === m.name 
                          ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-sm' 
                          : 'border-[#E5B05C]/20 hover:border-[#8B1E2D]/40 hover:bg-[#FAF6ED]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#3D0D11] text-base sm:text-lg flex items-center gap-2">
                          <span>🚇</span> {m.name}
                        </p>
                        {m.line && (
                          <span className="text-[10px] font-sans font-bold text-[#8B1E2D] bg-[#8B1E2D]/10 px-2.5 py-0.5 rounded-full">
                            {m.line}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#3D0D11]/60 mt-1 font-sans">{m.address}</p>
                    </button>
                  ))
                )}
              </div>
              
              <div className="mt-8 flex justify-between">
                <button onClick={handlePrev} className="text-[#C86040] hover:text-[#8B1E2D] font-bold text-sm underline underline-offset-4 cursor-pointer">{t.rpPrevStep}</button>
              </div>
            </div>
          )}

          {/* Step 3: Time Budget */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-[#8B1E2D]" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#8B1E2D]">{t.rpTimeTitle}</h2>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-8 font-sans font-medium">{t.rpTimeSubtitle}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[ 
                  { label: t.rpTime2h, sub: t.rpTime2hSub, min: 120 },
                  { label: t.rpTime4h, sub: t.rpTime4hSub, min: 240 },
                  { label: t.rpTime6h, sub: t.rpTime6hSub, min: 360 },
                  { label: t.rpTime8h, sub: t.rpTime8hSub, min: 480 },
                  { label: t.rpTimeFullDay, sub: t.rpTimeFullDaySub, min: -1 }
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setTimeBudgetMin(opt.min)}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                      timeBudgetMin === opt.min 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md scale-105 ring-2 ring-[#8B1E2D]/20' 
                        : 'border-[#E5B05C]/30 hover:border-[#8B1E2D]/50 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <p className="font-bold text-[#8B1E2D] text-xl mb-1">{opt.label}</p>
                    <p className="text-[11px] text-[#3D0D11]/60 font-sans">{opt.sub}</p>
                  </button>
                ))}
              </div>

              {timeBudgetMin === -1 && (
                <div className="mt-6 p-5 bg-[#FAF6ED] rounded-2xl border border-[#E5B05C]/40 flex flex-col sm:flex-row gap-4 items-center justify-around animate-in fade-in zoom-in duration-300">
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-[#8B1E2D] font-bold mb-1.5 font-sans">{t.rpStartTime}</label>
                    <input 
                      type="time" 
                      value={customStartTime} 
                      onChange={e => setCustomStartTime(e.target.value)} 
                      className="bg-white border border-[#E5B05C] rounded-lg px-3.5 py-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E2D]" 
                    />
                  </div>
                  <div className="text-[#C86040] font-bold text-xl hidden sm:block">➔</div>
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-[#8B1E2D] font-bold mb-1.5 font-sans">{t.rpEndTime}</label>
                    <input 
                      type="time" 
                      value={customEndTime} 
                      onChange={e => setCustomEndTime(e.target.value)} 
                      className="bg-white border border-[#E5B05C] rounded-lg px-3.5 py-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E2D]" 
                    />
                  </div>
                </div>
              )}

              <div className="mt-10 flex justify-between items-center">
                <button onClick={handlePrev} className="text-[#C86040] hover:text-[#8B1E2D] font-bold text-sm underline underline-offset-4 cursor-pointer">{t.rpPrevStep}</button>
                <button 
                  onClick={handleNext}
                  className="bg-[#8B1E2D] hover:bg-[#581318] text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {t.rpNextStep}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Viewing Pace */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-8 h-8 text-[#8B1E2D]" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#8B1E2D]">{t.rpPaceTitle}</h2>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-8 font-sans font-medium">{t.rpPaceSubtitle}</p>

              <div className="space-y-4">
                {[ 
                  { label: t.rpPaceFast, desc: t.rpPaceFastDesc, min: 5, badge: t.rpPaceFastBadge },
                  { label: t.rpPaceBalanced, desc: t.rpPaceBalancedDesc, min: 7, badge: t.rpPaceBalancedBadge },
                  { label: t.rpPaceRelaxed, desc: t.rpPaceRelaxedDesc, min: 12, badge: t.rpPaceRelaxedBadge },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setViewingPace(opt.min)}
                    className={`w-full p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      viewingPace === opt.min 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md ring-2 ring-[#8B1E2D]/20' 
                        : 'border-[#E5B05C]/30 hover:border-[#8B1E2D]/40 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-[#8B1E2D] text-lg mb-1">{opt.label}</p>
                      <p className="text-xs text-[#3D0D11]/70 font-sans">{opt.desc}</p>
                    </div>
                    <span className={`text-[10px] font-sans font-bold px-3 py-1 rounded-full ${
                      viewingPace === opt.min ? 'bg-[#8B1E2D] text-white' : 'bg-[#FAF6ED] text-[#8B1E2D] border border-[#8B1E2D]/20'
                    }`}>
                      {opt.badge}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button onClick={handlePrev} className="text-[#C86040] hover:text-[#8B1E2D] font-bold text-sm underline underline-offset-4 cursor-pointer">{t.rpPrevStep}</button>
                <button onClick={handleNext} className="bg-[#8B1E2D] hover:bg-[#581318] text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer">
                  {t.rpNextStep}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Restaurant Break */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <Coffee className="w-8 h-8 text-[#8B1E2D]" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#8B1E2D]">{t.rpFoodTitle}</h2>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-8 font-sans font-medium">{t.rpFoodSubtitle}</p>

              <div className="grid grid-cols-2 gap-4">
                {[ 
                  { label: t.rpFoodNo, desc: t.rpFoodNoDesc, min: 0, icon: "⚡" },
                  { label: t.rpFoodYes, desc: t.rpFoodYesDesc, min: 90, icon: "🍽️" },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setRestaurantBreak(opt.min)}
                    className={`p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                      restaurantBreak === opt.min 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md scale-[1.02] ring-2 ring-[#8B1E2D]/20' 
                        : 'border-[#E5B05C]/30 hover:border-[#8B1E2D]/50 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.icon}</div>
                    <p className="font-bold text-[#8B1E2D] text-lg mb-1">{opt.label}</p>
                    <p className="text-xs text-[#3D0D11]/60 font-sans">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button onClick={handlePrev} className="text-[#C86040] hover:text-[#8B1E2D] font-bold text-sm underline underline-offset-4 cursor-pointer">{t.rpPrevStep}</button>
                <button onClick={handleNext} className="bg-[#8B1E2D] hover:bg-[#581318] text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer">
                  {t.rpNextStep}
                </button>
              </div>
            </div>
          )}

          {/* Step 6: End Preference & Generate */}
          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-[#8B1E2D]" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#8B1E2D]">{t.rpEndTitle}</h2>
              </div>
              <p className="text-sm text-[#3D0D11]/70 mb-8 font-sans font-medium">{t.rpEndSubtitle}</p>

              <div className="space-y-4">
                {[ 
                  { label: t.rpEndAnywhere, desc: t.rpEndAnywhereDesc, val: 'anywhere' },
                  { label: t.rpEndNearestMetro, desc: t.rpEndNearestMetroDesc, val: 'nearest_metro' },
                  { label: t.rpEndStartMetro, desc: t.rpEndStartMetroDesc, val: 'start_metro' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setEndPreference(opt.val)}
                    className={`w-full p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                      endPreference === opt.val 
                        ? 'border-[#8B1E2D] bg-[#8B1E2D]/5 shadow-md ring-2 ring-[#8B1E2D]/20' 
                        : 'border-[#E5B05C]/30 hover:border-[#8B1E2D]/40 hover:bg-[#FAF6ED]'
                    }`}
                  >
                    <p className="font-bold text-[#8B1E2D] text-lg mb-1">{opt.label}</p>
                    <p className="text-xs text-[#3D0D11]/70 font-sans">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button onClick={handlePrev} className="text-[#C86040] hover:text-[#8B1E2D] font-bold text-sm underline underline-offset-4 cursor-pointer">{t.rpPrevStep}</button>
                <button 
                  onClick={generateRoute} 
                  className="bg-[#8B1E2D] hover:bg-[#581318] text-white px-9 py-3.5 rounded-full font-bold shadow-lg hover:shadow-2xl transition-all flex items-center gap-2.5 text-base transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{t.rpGenerateBtn}</span>
                  <MapIcon className="w-5 h-5 text-[#E5B05C]" />
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Route Result (Interactive Map + Timeline View) */}
          {step === 7 && (
            <div className="animate-in fade-in duration-500">
              {loadingRoute ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 border-4 border-[#E5B05C]/30 border-t-[#8B1E2D] rounded-full animate-spin mb-6"></div>
                  <h3 className="text-2xl font-bold text-[#8B1E2D] animate-pulse">{t.rpLoadingTitle}</h3>
                  <p className="text-sm text-[#3D0D11]/60 mt-2 font-sans font-medium">{t.rpLoadingSubtitle}</p>
                </div>
              ) : routeResult ? (
                <div className="space-y-6">
                  
                  {/* Results Header Card */}
                  <div className="bg-[#FAF6ED] p-6 sm:p-8 rounded-3xl border border-[#E5B05C]/40 text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5B05C]/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <span className="inline-block text-[11px] font-sans font-bold text-[#8B1E2D] bg-[#8B1E2D]/10 px-3.5 py-1 rounded-full uppercase tracking-wider mb-2">
                      {t.rpResultTag}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#8B1E2D] mb-2">{t.rpResultTitle}</h2>
                    
                    {/* Start & End Destination Banner */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-3 text-xs sm:text-sm font-sans font-medium">
                      <div className="bg-white px-3.5 py-1.5 rounded-full border border-[#1E3A8A]/30 text-[#1E3A8A] flex items-center gap-1.5 shadow-sm">
                        <span>🚇 {t.rpStartMetroLabel}</span>
                        <strong className="font-bold">{routeResult.start_metro}</strong>
                      </div>
                      <span className="text-[#8B1E2D] font-bold text-base">➔</span>
                      <div className="bg-white px-3.5 py-1.5 rounded-full border border-[#8B1E2D]/30 text-[#8B1E2D] flex items-center gap-1.5 shadow-sm">
                        <span>🏁 {t.rpEndDestinationLabel}</span>
                        <strong className="font-bold">{routeResult.stops[routeResult.stops.length - 1]?.name || 'Final Stop'}</strong>
                      </div>
                    </div>

                    {/* Stats Metric Badges */}
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4">
                      <div className="bg-white px-5 py-3 rounded-2xl border border-[#E5B05C]/30 shadow-sm min-w-[100px]">
                        <span className="block text-2xl sm:text-3xl font-bold text-[#8B1E2D]">{routeResult.total_pandals}</span>
                        <span className="text-[10px] text-[#3D0D11]/60 font-sans font-bold uppercase tracking-widest">{t.rpTotalPandals}</span>
                      </div>
                      <div className="bg-white px-5 py-3 rounded-2xl border border-[#E5B05C]/30 shadow-sm min-w-[100px]">
                        <span className="block text-2xl sm:text-3xl font-bold text-[#8B1E2D]">
                          {Math.floor(routeResult.usable_time_min / 60)}{t.rpHours} {routeResult.usable_time_min % 60}{t.rpMinShort}
                        </span>
                        <span className="text-[10px] text-[#3D0D11]/60 font-sans font-bold uppercase tracking-widest">{t.rpTotalTime}</span>
                      </div>
                      {routeResult.restaurant_break_included && (
                        <div className="bg-white px-5 py-3 rounded-2xl border border-[#E5B05C]/30 shadow-sm min-w-[100px]">
                          <span className="block text-2xl sm:text-3xl font-bold text-[#C86040]">1.5{t.rpHours}</span>
                          <span className="text-[10px] text-[#3D0D11]/60 font-sans font-bold uppercase tracking-widest">{t.rpFoodBreak}</span>
                        </div>
                      )}
                    </div>

                    {/* Google Maps External Link */}
                    {routeResult.stops.length > 0 && (
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <a
                          href={getGoogleMapsRouteUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#8B1E2D] hover:bg-[#581318] text-white px-6 py-3 rounded-full text-xs font-bold shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Compass className="w-4 h-4 text-[#E5B05C]" />
                          <span>{t.rpOpenGmapsBtn}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* View Mode Toggle: Interactive Map vs Timeline */}
                  <div className="flex items-center justify-center gap-2 p-1 bg-[#FAF6ED] rounded-2xl border border-[#E5B05C]/30 max-w-xs mx-auto">
                    <button
                      onClick={() => setActiveTab('map')}
                      className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'map' ? 'bg-[#8B1E2D] text-white shadow-sm' : 'text-[#3D0D11]/70 hover:text-[#8B1E2D]'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>{t.rpMapView}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'timeline' ? 'bg-[#8B1E2D] text-white shadow-sm' : 'text-[#3D0D11]/70 hover:text-[#8B1E2D]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t.rpTimelineView}</span>
                    </button>
                  </div>

                  {/* 1. Interactive Route Map Container */}
                  <div className={`relative w-full h-[450px] sm:h-[520px] rounded-3xl overflow-hidden border-2 border-[#E5B05C]/40 shadow-lg ${activeTab === 'map' ? 'block' : 'hidden'}`}>
                    <div ref={mapContainerRef} className="w-full h-full" />
                    
                    {/* Map Legend Overlay */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#E5B05C]/40 shadow-md text-[10px] font-sans font-bold text-[#3D0D11] space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[8px]">🚇</span>
                        <span>{t.rpLegendMetro}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#8B1E2D] text-white flex items-center justify-center text-[8px]">১</span>
                        <span>{t.rpLegendPandal}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Step-by-Step Route Timeline */}
                  <div className={`space-y-4 ${activeTab === 'timeline' ? 'block' : 'hidden'}`}>
                    {routeResult.stops.length > 0 ? (
                      <div className="relative pl-8 border-l-2 border-dashed border-[#E5B05C]/60 space-y-6 my-6 ml-4">
                        
                        {/* Initial Start Metro Marker */}
                        <div className="relative">
                          <div className="absolute w-8 h-8 bg-[#1E3A8A] rounded-full -left-[49px] top-0 border-4 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
                            🚇
                          </div>
                          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#1E3A8A]/30 bg-[#1E3A8A]/5 shadow-sm">
                            <span className="text-[10px] font-sans font-bold text-[#1E3A8A] bg-[#1E3A8A]/10 px-2.5 py-0.5 rounded-full mb-1 inline-block">
                              {t.rpStartPoint}
                            </span>
                            <h4 className="text-lg font-bold text-[#1E3A8A] mb-0.5">{routeResult.start_metro}</h4>
                            <p className="text-xs text-[#3D0D11]/70 font-sans">{t.rpStartDesc}</p>
                          </div>
                        </div>

                        {routeResult.stops.map((stop, idx) => (
                          <div key={idx} className="relative">
                            {/* Number Pin */}
                            <div className={`absolute w-8 h-8 rounded-full -left-[49px] top-0 border-4 border-white shadow-md flex items-center justify-center text-white text-xs font-bold ${
                              stop.is_metro ? 'bg-[#1E3A8A]' : 'bg-[#8B1E2D]'
                            }`}>
                              {stop.is_metro ? '🏁' : idx + 1}
                            </div>
                            
                            <div className={`p-4 sm:p-5 rounded-2xl shadow-sm relative -top-2 hover:shadow-md transition-shadow ${
                              stop.is_metro 
                                ? 'bg-[#F0F4FF] border-2 border-[#1E3A8A]/40' 
                                : 'bg-white border border-[#E5B05C]/30'
                            }`}>
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <div>
                                  <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full mb-1 inline-block ${
                                    stop.is_metro 
                                      ? 'text-[#1E3A8A] bg-[#1E3A8A]/15 font-bold' 
                                      : 'text-[#8B1E2D] bg-[#8B1E2D]/10'
                                  }`}>
                                    {stop.is_metro ? `🏁 ${t.rpEndMetroBadge}` : `${t.rpPandalPrefix} #${idx + 1}`}
                                  </span>
                                  <h4 className={`text-lg font-bold leading-tight ${stop.is_metro ? 'text-[#1E3A8A]' : 'text-[#3D0D11]'}`}>
                                    {stop.name}
                                  </h4>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + ' ' + stop.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 bg-[#FAF6ED] hover:bg-[#8B1E2D] hover:text-white text-[#8B1E2D] border border-[#8B1E2D]/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                  <span>{t.viewOnMap}</span>
                                </a>
                              </div>
                              <p className="text-xs text-[#3D0D11]/60 mb-3 font-sans">{stop.address}</p>
                              
                              <div className="flex flex-wrap gap-2 text-[11px] font-bold text-[#8B1E2D] font-sans">
                                <span className="flex items-center gap-1 bg-[#FAF6ED] px-2.5 py-1 rounded-lg border border-[#E5B05C]/30">
                                  <Navigation className="w-3 h-3 text-[#C86040]" />
                                  {idx === 0 ? `${t.rpFromMetro}${stop.estimated_travel_min} ${t.rpMinutes}` : `${t.rpFromPrev}${stop.estimated_travel_min} ${t.rpMinutes}`}
                                </span>
                                <span className="flex items-center gap-1 bg-[#FAF6ED] px-2.5 py-1 rounded-lg border border-[#E5B05C]/30">
                                  <Clock className="w-3 h-3 text-[#C86040]" />
                                  {t.rpCumulativeTime} {Math.floor(stop.cumulative_time_min / 60)}{t.rpHours} {stop.cumulative_time_min % 60}{t.rpMinShort}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-[#8B1E2D] font-bold text-lg">{t.rpNoPandalsFound}</p>
                      </div>
                    )}
                  </div>

                  {/* Safety & Timing Notice */}
                  <div className="bg-[#FAF6ED] p-4 sm:p-5 rounded-2xl border border-[#E5B05C]/40 flex items-start gap-3">
                    <span className="text-lg">ℹ️</span>
                    <p className="text-xs text-[#8B1E2D] leading-relaxed font-sans font-medium">
                      * <strong>{t.rpSafetyNotice}</strong>
                    </p>
                  </div>

                  {/* Reset & Replan Button */}
                  <button 
                    onClick={() => { setStep(1); setRouteResult(null); }}
                    className="w-full bg-white text-[#8B1E2D] border-2 border-[#8B1E2D] hover:bg-[#8B1E2D] hover:text-white px-8 py-3.5 rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t.rpReplanBtn}</span>
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
