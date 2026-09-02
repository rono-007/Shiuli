import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Map as MapIcon, Clock, Zap, Coffee, CheckCircle, MapPin, Navigation, Compass, Layers, RotateCcw } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLanguage } from '../context/LanguageContext';

import { routeEngine } from '../routeEngine/engine';
import type { RoutePlanResponse, MetroStation, PandalItem } from '../routeEngine/types';

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

// In-memory module caches to avoid repeated network transfer on re-generation
const regionPandalsCache: Record<string, PandalItem[]> = {};
let metroStationsCache: MetroStation[] | null = null;

// Helper to clean up long/redundant geocoded address strings for clean card presentation
function formatDisplayAddress(addr?: string): string {
  if (!addr) return 'কলকাতা';
  let cleaned = addr
    .replace(/,\s*India$/i, '')
    .replace(/,\s*West Bengal\s*\d*$/i, '')
    .replace(/,\s*Kolkata\s*\d*$/i, '')
    .replace(/,\s*Ward Number\s*\d+/gi, '')
    .replace(/,\s*Ward\s*\d+/gi, '')
    .trim();
  const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length > 3) {
    return parts.slice(0, 3).join(', ');
  }
  return cleaned || addr;
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
      // 1. Fetch required region data locally on demand
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

      // 2. Initialize Route Engine (happens instantly locally)
      routeEngine.initialize(pool, metros);

      // 3. Generate Route
      const result = routeEngine.generateRoute({
        region: selectedRegion || 'all',
        metro_station_name: metroName,
        start_lat: startLat,
        start_lon: startLon,
        total_minutes: Number(finalBudget) || 240,
        viewing_pace_minutes: Number(viewingPace) || 7,
        restaurant_break_minutes: Number(restaurantBreak) || 0,
        end_preference: endPreference || 'anywhere'
      });

      if (result) {
        setRouteResult(result);
      } else {
        console.warn("Failed to generate a valid route.");
        setRouteResult(null);
      }

    } catch (err) {
      console.error("Error during route generation", err);
      setRouteResult(null);
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
      
      const cleanStartAddr = formatDisplayAddress(startMetro?.address);
      const startGmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${startLat},${startLon}`;

      new maplibregl.Marker({ element: startEl })
        .setLngLat([startLon, startLat])
        .setPopup(
          new maplibregl.Popup({ offset: 14, className: 'route-planner-popup', maxWidth: '320px' }).setHTML(`
            <div class="route-card-popup" style="font-family: 'Noto Sans Bengali', sans-serif; color: #2D0B10; padding: 2px; width: 260px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-right: 22px;">
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  font-size: 11px;
                  font-weight: 800;
                  color: #FFFFFF;
                  background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
                  padding: 3.5px 10px;
                  border-radius: 9999px;
                  border: 1px solid rgba(255, 255, 255, 0.4);
                  box-shadow: 0 2px 6px rgba(30, 58, 138, 0.25);
                ">
                  🚇 ${t.rpStartPoint || 'প্রারম্ভিক স্টেশন'}
                </span>
              </div>

              <h4 style="
                margin: 0 0 5px 0;
                font-family: 'Noto Serif Bengali', 'Tiro Bangla', Georgia, serif;
                color: #1E3A8A !important;
                font-size: 15px;
                font-weight: 800;
                line-height: 1.35;
              ">
                ${selectedMetro || 'মেট্রো স্টেশন'}
              </h4>

              <div style="
                display: flex;
                align-items: flex-start;
                gap: 5px;
                margin-bottom: 12px;
                font-size: 11px;
                line-height: 1.45;
                color: #635754;
              ">
                <span style="color: #1E3A8A; font-size: 12px; line-height: 1; margin-top: 1.5px; flex-shrink: 0;">📍</span>
                <span>${cleanStartAddr || 'রুট শুরুর প্রারম্ভিক বিন্দু'}</span>
              </div>

              <a 
                href="${startGmapsUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  width: 100%;
                  background: linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%);
                  color: #FFFFFF;
                  font-size: 11.5px;
                  font-weight: 700;
                  padding: 8.5px 12px;
                  border-radius: 12px;
                  text-decoration: none;
                  box-shadow: 0 3px 10px rgba(30, 58, 138, 0.25);
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  transition: all 0.2s ease;
                  box-sizing: border-box;
                "
                onmouseover="this.style.background='linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)'; this.style.transform='translateY(-1px)';"
                onmouseout="this.style.background='linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)'; this.style.transform='translateY(0)';"
              >
                <span>মেট্রো স্টেশনে পথনির্দেশ</span>
                <span style="font-size: 12px;">↗</span>
              </a>
            </div>
          `)
        )
        .addTo(map);

      // Add each stop coordinate and custom numbered marker
      routeResult.stops.forEach((stop, index) => {
        allCoords.push([stop.lon, stop.lat]);

        const markerEl = document.createElement('div');
        markerEl.className = stop.is_metro 
          ? 'w-9 h-9 rounded-full bg-[#1E3A8A] text-white border-2 border-white shadow-xl flex items-center justify-center font-bold text-sm cursor-pointer transform hover:scale-110 transition-transform'
          : 'w-8 h-8 rounded-full bg-[#8B1E2D] text-white border-2 border-[#E5B05C] shadow-lg flex items-center justify-center font-bold text-xs cursor-pointer transform hover:scale-125 transition-transform';
        
        markerEl.innerHTML = stop.is_metro ? '🚇' : `${index + 1}`;

        const cleanAddr = formatDisplayAddress(stop.address);
        const hours = Math.floor(stop.cumulative_time_min / 60);
        const mins = stop.cumulative_time_min % 60;
        const totalTimeStr = hours > 0 
          ? `${hours}${t.rpHours || 'ঘ'} ${mins}${t.rpMinShort || 'মি'}` 
          : `${mins} ${t.rpMinutes || 'মিনিট'}`;
        const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lon}`;

        new maplibregl.Marker({ element: markerEl })
          .setLngLat([stop.lon, stop.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 14, className: 'route-planner-popup', maxWidth: '320px' }).setHTML(`
              <div class="route-card-popup" style="
                font-family: 'Noto Sans Bengali', sans-serif;
                color: #2D0B10;
                padding: 2px;
                width: 270px;
              ">
                <!-- Top Badge Row -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-right: 22px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="
                      display: inline-flex;
                      align-items: center;
                      gap: 4px;
                      font-size: 11px;
                      font-weight: 800;
                      color: #FFFFFF;
                      background: ${stop.is_metro ? 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' : 'linear-gradient(135deg, #8B1E2D 0%, #B91C1C 100%)'};
                      padding: 3.5px 10px;
                      border-radius: 9999px;
                      border: 1px solid ${stop.is_metro ? 'rgba(255, 255, 255, 0.4)' : 'rgba(229, 176, 92, 0.6)'};
                      box-shadow: 0 2px 6px ${stop.is_metro ? 'rgba(30, 58, 138, 0.25)' : 'rgba(139, 30, 45, 0.25)'};
                    ">
                      ${stop.is_metro ? '🚇 সমাপ্তি মেট্রো' : `🪔 ${t.rpStepPrefix || 'ধাপ'} ${index + 1}`}
                    </span>
                    ${!stop.is_metro ? `
                      <span style="
                        font-size: 10px;
                        font-weight: 700;
                        color: #8B1E2D;
                        background: rgba(139, 30, 45, 0.08);
                        border: 1px solid rgba(139, 30, 45, 0.15);
                        padding: 3px 8px;
                        border-radius: 9999px;
                      ">পুজো মণ্ডপ</span>
                    ` : ''}
                  </div>
                </div>

                <!-- Pandal Name -->
                <h4 style="
                  margin: 0 0 6px 0;
                  font-family: 'Noto Serif Bengali', 'Tiro Bangla', Georgia, serif;
                  color: #2D0B10 !important;
                  font-size: 15px;
                  font-weight: 800;
                  line-height: 1.35;
                  letter-spacing: -0.01em;
                ">
                  ${stop.name}
                </h4>

                <!-- Address -->
                <div style="
                  display: flex;
                  align-items: flex-start;
                  gap: 5px;
                  margin-bottom: 12px;
                  font-size: 11px;
                  line-height: 1.45;
                  color: #635754;
                ">
                  <span style="color: #8B1E2D; font-size: 12px; line-height: 1; margin-top: 1.5px; flex-shrink: 0;">📍</span>
                  <span style="
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                  ">${cleanAddr}</span>
                </div>

                <!-- Metric Statistics 2-column Grid -->
                <div style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 6px;
                  margin-bottom: 12px;
                ">
                  <div style="
                    background: #FAF6ED;
                    border: 1px solid rgba(229, 176, 92, 0.4);
                    border-radius: 12px;
                    padding: 7px 9px;
                    display: flex;
                    flex-direction: column;
                  ">
                    <span style="font-size: 9.5px; color: #8C7A75; font-weight: 700; display: flex; align-items: center; gap: 3px;">
                      <span>🚶</span> হাঁটার সময়
                    </span>
                    <span style="font-size: 12px; font-weight: 800; color: #8B1E2D; margin-top: 2px;">
                      ~${stop.estimated_travel_min} ${t.rpMinutes || 'মিনিট'}
                    </span>
                  </div>

                  <div style="
                    background: #FAF6ED;
                    border: 1px solid rgba(229, 176, 92, 0.4);
                    border-radius: 12px;
                    padding: 7px 9px;
                    display: flex;
                    flex-direction: column;
                  ">
                    <span style="font-size: 9.5px; color: #8C7A75; font-weight: 700; display: flex; align-items: center; gap: 3px;">
                      <span>⏱️</span> মোট সময়
                    </span>
                    <span style="font-size: 12px; font-weight: 800; color: #C86040; margin-top: 2px;">
                      ${totalTimeStr}
                    </span>
                  </div>
                </div>

                <!-- Google Maps CTA Button -->
                <a 
                  href="${gmapsUrl}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    width: 100%;
                    background: linear-gradient(135deg, #8B1E2D 0%, #68141F 100%);
                    color: #FAF6ED;
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 8.5px 12px;
                    border-radius: 12px;
                    text-decoration: none;
                    box-shadow: 0 3px 10px rgba(139, 30, 45, 0.28);
                    border: 1px solid rgba(229, 176, 92, 0.45);
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                  "
                  onmouseover="this.style.background='linear-gradient(135deg, #A32435 0%, #8B1E2D 100%)'; this.style.transform='translateY(-1px)';"
                  onmouseout="this.style.background='linear-gradient(135deg, #8B1E2D 0%, #68141F 100%)'; this.style.transform='translateY(0)';"
                >
                  <span>গুগল ম্যাপসে পথ দেখুন</span>
                  <span style="font-size: 12px;">↗</span>
                </a>
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
                              <p className="text-xs text-[#3D0D11]/70 mb-3 font-sans flex items-center gap-1.5">
                                <span className="text-[#8B1E2D] text-xs">📍</span>
                                <span>{formatDisplayAddress(stop.address)}</span>
                              </p>
                              
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
