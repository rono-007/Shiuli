import React, { useRef, useEffect, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getNearestEateriesWithFallback } from '../utils/nearbyEateries';
import { getNearestFacilities } from '../utils/nearbyFacilities';
import { MapPin, Navigation, Utensils, Star, AlertCircle, Fuel, CreditCard, Hospital, Bath, X, Layers, Pill } from 'lucide-react';

interface Pandal {
  name: string;
  api_name: string;
  address: string;
  lat: number;
  lon: number;
  status: string;
}

interface PandalMapProps {
  pandals: Pandal[];
  selectedPandalName: string | null;
  searchQuery: string;
}

// Kolkata North center coordinates
const KOLKATA_CENTER: [number, number] = [88.37, 22.60];
const DEFAULT_ZOOM = 12.5;

// Free CARTO Voyager raster basemap specification
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Helper: Generate a 1km GeoJSON circle polygon for highlighting nearby zone
function createGeoJSONCircle(center: [number, number], radiusInKm = 1, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0]
  };
  const km = radiusInKm;

  const ret: [number, number][] = [];
  const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [ret]
    },
    properties: {}
  };
}

const PandalMap: React.FC<PandalMapProps> = ({ pandals, selectedPandalName, searchQuery }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const facilityMarkersRef = useRef<maplibregl.Marker[]>([]);
  const detailsCardRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activePandal, setActivePandal] = useState<{ pandal: Pandal; idx: number } | null>(null);
  const [selectedFacilityTitle, setSelectedFacilityTitle] = useState<string | null>(null);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: KOLKATA_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      cooperativeGestures: true,
      dragRotate: false,
      touchPitch: false,
    });

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      'top-left'
    );

    // Geolocation control
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    });

    geolocate.on('geolocate', (e: any) => {
      const { longitude, latitude } = e.coords;
      setUserLocation([longitude, latitude]);
    });

    map.current.addControl(geolocate, 'top-left');

    const handleLoad = () => {
      setIsMapLoaded(true);
      map.current?.resize();

      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    };

    map.current.on('load', handleLoad);
    map.current.on('error', (e) => {
      console.warn('MapLibre error:', e);
      setIsMapLoaded(true);
    });

    const handleWindowResize = () => {
      map.current?.resize();
    };
    window.addEventListener('resize', handleWindowResize);

    const t1 = setTimeout(() => { setIsMapLoaded(true); map.current?.resize(); }, 300);
    const t2 = setTimeout(() => { map.current?.resize(); }, 800);
    const t3 = setTimeout(() => { map.current?.resize(); }, 1500);

    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // User location marker
  useEffect(() => {
    if (!map.current || !isMapLoaded || !userLocation) return;

    if (map.current.getSource('user-location-src')) {
      const src = map.current.getSource('user-location-src') as maplibregl.GeoJSONSource;
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: userLocation },
      });
      return;
    }

    map.current.addSource('user-location-src', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: userLocation },
      },
    });

    map.current.addLayer({
      id: 'user-location-halo',
      type: 'circle',
      source: 'user-location-src',
      paint: {
        'circle-radius': 16,
        'circle-color': '#1E88E5',
        'circle-opacity': 0.25,
      },
    });

    map.current.addLayer({
      id: 'user-location-point',
      type: 'circle',
      source: 'user-location-src',
      paint: {
        'circle-radius': 8,
        'circle-color': '#1E88E5',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#FAF6ED',
      },
    });
  }, [userLocation, isMapLoaded]);

  // Add/update pandal markers when pandals change or map loads
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const q = searchQuery.toLowerCase().trim();
    const filteredPandals = q
      ? pandals.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          (p.api_name && p.api_name.toLowerCase().includes(q))
        )
      : pandals;

    filteredPandals.forEach((pandal, idx) => {
      const isSelected = activePandal?.pandal.name === pandal.name;

      const el = document.createElement('div');
      el.className = 'pandal-marker';
      el.innerHTML = `
        <div style="
          width: ${isSelected ? '34px' : '28px'};
          height: ${isSelected ? '34px' : '28px'};
          background: ${isSelected ? '#8B1E2D' : '#8B1E2D'};
          border: ${isSelected ? '3px solid #E5B05C' : '2.5px solid #FAF6ED'};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: ${isSelected ? '0 4px 14px rgba(139, 30, 45, 0.7)' : '0 2px 8px rgba(139, 30, 45, 0.4)'};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        ">
          <span style="
            transform: rotate(45deg);
            color: #FAF6ED;
            font-size: ${isSelected ? '11px' : '10px'};
            font-weight: 700;
            font-family: monospace;
            line-height: 1;
          ">${String(idx + 1).padStart(2, '0')}</span>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        const inner = el.querySelector('div') as HTMLElement;
        if (inner) {
          inner.style.transform = 'rotate(-45deg) scale(1.2)';
        }
      });
      el.addEventListener('mouseleave', () => {
        const inner = el.querySelector('div') as HTMLElement;
        if (inner) {
          inner.style.transform = 'rotate(-45deg) scale(1)';
        }
      });

      // Click event: Select pandal and open details card
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setActivePandal({ pandal, idx });
        setSelectedFacilityTitle(null);

        if (map.current) {
          const isMobile = window.innerWidth < 640;
          map.current.flyTo({
            center: [pandal.lon, pandal.lat],
            zoom: 15.5,
            duration: 1000,
            padding: {
              right: isMobile ? 20 : 380,
              top: 20,
              bottom: 20,
              left: 20,
            },
            essential: true,
          });
        }

        // On mobile, smoothly scroll details card into view below the map
        if (window.innerWidth < 640) {
          setTimeout(() => {
            detailsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([pandal.lon, pandal.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    if (filteredPandals.length > 0 && !selectedPandalName && !activePandal) {
      const bounds = new maplibregl.LngLatBounds();
      filteredPandals.forEach(p => bounds.extend([p.lon, p.lat]));
      map.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [pandals, isMapLoaded, searchQuery, activePandal?.pandal.name]);

  // Fly to selected pandal from external selection
  useEffect(() => {
    if (!map.current || !isMapLoaded || !selectedPandalName) return;

    const idx = pandals.findIndex(p => p.name === selectedPandalName);
    if (idx < 0) return;

    const pandal = pandals[idx];
    setActivePandal({ pandal, idx });
    setSelectedFacilityTitle(null);

    const isMobile = window.innerWidth < 640;
    map.current.flyTo({
      center: [pandal.lon, pandal.lat],
      zoom: 15.5,
      duration: 1200,
      padding: {
        right: isMobile ? 20 : 380,
        top: 20,
        bottom: 20,
        left: 20,
      },
      essential: true,
    });
  }, [selectedPandalName, isMapLoaded]);

  // Highlight 1km Proximity Zone Circle when activePandal changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear facility markers & 1km proximity circle
    facilityMarkersRef.current.forEach(m => m.remove());
    facilityMarkersRef.current = [];

    if (map.current.getLayer('pandal-highlight-zone-stroke')) {
      map.current.removeLayer('pandal-highlight-zone-stroke');
    }
    if (map.current.getLayer('pandal-highlight-zone-fill')) {
      map.current.removeLayer('pandal-highlight-zone-fill');
    }
    if (map.current.getSource('pandal-highlight-zone-src')) {
      map.current.removeSource('pandal-highlight-zone-src');
    }

    if (!activePandal) return;

    const { pandal } = activePandal;
    const circleData = createGeoJSONCircle([pandal.lon, pandal.lat], 1.0);

    map.current.addSource('pandal-highlight-zone-src', {
      type: 'geojson',
      data: circleData,
    });

    map.current.addLayer({
      id: 'pandal-highlight-zone-fill',
      type: 'fill',
      source: 'pandal-highlight-zone-src',
      paint: {
        'fill-color': '#8B1E2D',
        'fill-opacity': 0.08,
      },
    });

    map.current.addLayer({
      id: 'pandal-highlight-zone-stroke',
      type: 'line',
      source: 'pandal-highlight-zone-src',
      paint: {
        'line-color': '#8B1E2D',
        'line-width': 2,
        'line-dasharray': [3, 3],
      },
    });
  }, [activePandal?.pandal.name, isMapLoaded]);

  // Function to highlight a single clicked facility/eatery on the map!
  const highlightSingleItemOnMap = (
    item: { title: string; lat: number; lng: number; url?: string | null; distanceMeters?: number } | null | undefined,
    icon: string,
    color: string
  ) => {
    if (!item || !map.current) return;

    setSelectedFacilityTitle(item.title);

    // Remove existing facility markers
    facilityMarkersRef.current.forEach(m => m.remove());
    facilityMarkersRef.current = [];

    const fEl = document.createElement('div');
    fEl.className = 'facility-map-icon-highlighted';
    fEl.style.display = 'flex';
    fEl.style.alignItems = 'center';
    fEl.style.justifyContent = 'center';
    fEl.style.width = '34px';
    fEl.style.height = '34px';
    fEl.style.background = '#FAF6ED';
    fEl.style.border = `3px solid ${color}`;
    fEl.style.borderRadius = '50%';
    fEl.style.boxShadow = `0 0 0 6px ${color}25, 0 6px 16px rgba(16, 24, 39, 0.4)`;
    fEl.style.cursor = 'pointer';
    fEl.style.fontSize = '16px';
    fEl.style.lineHeight = '1';
    fEl.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

    fEl.innerHTML = `<span>${icon}</span>`;

    const mapUrl = item.url || `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;

    const fPopup = new maplibregl.Popup({ offset: 14, closeOnClick: false }).setHTML(`
      <div style="font-family: 'Tiro Bangla', Georgia, serif; padding: 4px; font-size: 11px; max-width: 200px;">
        <div style="font-weight: bold; color: ${color}; font-size: 12px; margin-bottom: 3px;">${icon} ${item.title}</div>
        ${item.distanceMeters ? `<div style="color: #666; font-size: 10px; margin-bottom: 6px;">দূরত্ব: ${item.distanceMeters}m</div>` : ''}
        <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #8B1E2D; color: #FAF6ED; padding: 5px 10px; border-radius: 8px; font-weight: bold; font-size: 10px; text-decoration: none; box-shadow: 0 2px 6px rgba(139,30,45,0.3);">
          <span>Google Maps GPS এ অবস্থান দেখুন ↗</span>
        </a>
      </div>
    `);

    const fMarker = new maplibregl.Marker({ element: fEl, anchor: 'center' })
      .setLngLat([item.lng, item.lat])
      .setPopup(fPopup)
      .addTo(map.current!);

    facilityMarkersRef.current.push(fMarker);

    // Automatically open the popup on the map!
    setTimeout(() => {
      fMarker.togglePopup();
    }, 100);

    // Fly camera to focus on this facility
    const isMobile = window.innerWidth < 640;
    map.current.flyTo({
      center: [item.lng, item.lat],
      zoom: 16.5,
      duration: 1000,
      padding: {
        right: isMobile ? 20 : 380,
        top: 20,
        bottom: 20,
        left: 20,
      },
      essential: true,
    });

    // On mobile, scroll up to map to view the highlighted pin!
    if (isMobile && mapContainer.current) {
      mapContainer.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const activeFacilities = activePandal
    ? getNearestFacilities(activePandal.pandal.lat, activePandal.pandal.lon)
    : null;

  const eateryData = activePandal
    ? getNearestEateriesWithFallback(activePandal.pandal.lat, activePandal.pandal.lon, 6)
    : { within1km: [], relativelyFar: [] };

  const hasEateries = eateryData.within1km.length > 0;
  const eateriesToShow = hasEateries ? eateryData.within1km : eateryData.relativelyFar;

  return (
    <div className="flex flex-col sm:block relative w-full h-full min-h-[420px]">
      <style>{`
        .maplibregl-canvas {
          width: 100% !important;
          height: 100% !important;
          outline: none;
        }
        .maplibregl-map {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>

      {/* Map Container: 100% Full Height & Unobstructed on Mobile */}
      <div className="w-full h-[420px] sm:h-full sm:absolute sm:inset-0 rounded-2xl md:rounded-3xl overflow-hidden border border-ink/10 shadow-md sm:shadow-none relative">
        <div
          ref={mapContainer}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />

        {/* Loading Overlay */}
        {!isMapLoaded && (
          <div className="absolute inset-0 bg-[#FAF6ED] flex flex-col items-center justify-center gap-4 z-10">
            <div className="w-10 h-10 border-4 border-bengali-red/20 border-t-bengali-red rounded-full animate-spin" />
            <p className="text-xs font-sans text-ink/50 italic">মানচিত্র লোড হচ্ছে...</p>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-[#FAF6ED]/95 backdrop-blur-sm border border-ink/10 rounded-xl px-3 py-2 sm:px-4 sm:py-3 z-10 shadow-md space-y-1 sm:space-y-2 max-w-[200px] sm:max-w-none">
          <div className="flex items-center gap-2">
            <div style={{
              width: '12px',
              height: '12px',
              background: '#8B1E2D',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              border: '1.5px solid #FAF6ED',
            }} />
            <span className="text-[10px] font-mono text-ink/60 tracking-wider uppercase">
              পুজো মণ্ডপ • {pandals.length} টি
            </span>
          </div>

          {activePandal && (
            <div className="flex items-center gap-2 border-t border-ink/10 pt-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#8B1E2D] bg-[#8B1E2D]/20 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-mono text-bengali-red font-semibold tracking-wider uppercase">
                ১ কিমি পরিক্রমা এলাকা
              </span>
            </div>
          )}

          {userLocation && (
            <div className="flex items-center gap-2 border-t border-ink/10 pt-1">
              <div className="w-2 h-2 rounded-full bg-[#1E88E5] border border-white" />
              <span className="text-[9px] sm:text-[10px] font-mono text-[#1E88E5] font-semibold tracking-wider uppercase">
                আপনার অবস্থান
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PANDAL INFORMATION CARD: Positioned Below the Map on Mobile, Side Panel on Desktop */}
      {activePandal && (
        <div
          ref={detailsCardRef}
          className="w-full sm:w-[360px] md:w-[400px] sm:absolute sm:top-0 sm:right-0 sm:bottom-0 bg-[#FAF6ED] border border-ink/15 sm:border-y-0 sm:border-r-0 sm:border-l rounded-2xl sm:rounded-none shadow-xl sm:shadow-2xl z-30 flex flex-col justify-between overflow-hidden mt-4 sm:mt-0 animate-fade-in sm:animate-slide-in-right"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-bengali-red to-[#a02535] px-4 py-3 sm:px-5 sm:py-4 text-white flex items-center justify-between shadow-md flex-shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="text-[11px] sm:text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white tracking-widest flex-shrink-0">
                NC{String(activePandal.idx + 1).padStart(2, '0')}
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-white truncate">
                {activePandal.pandal.name}
              </h3>
            </div>
            <button
              onClick={() => {
                setActivePandal(null);
                setSelectedFacilityTitle(null);
                facilityMarkersRef.current.forEach(m => m.remove());
                facilityMarkersRef.current = [];
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors flex-shrink-0"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 font-sans text-xs custom-scrollbar">
            
            {/* Address & Navigation */}
            <div className="bg-paper p-3.5 sm:p-4 rounded-2xl border border-ink/10 space-y-2.5">
              <div className="flex items-start gap-2.5 text-ink/80">
                <MapPin className="w-4 h-4 text-bengali-red flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed text-xs">{activePandal.pandal.address}</span>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activePandal.pandal.lat},${activePandal.pandal.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-bengali-red text-white py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl font-bold hover:bg-bengali-red/90 transition-colors shadow-sm text-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Google Maps এ মণ্ডপটি দেখুন ↗</span>
              </a>
            </div>

            {/* Facility Cards */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-serif font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" />
                জরুরি সুবিধাসমূহ (ক্লিক করে মানচিত্রে দেখুন)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                
                {/* Petrol Pump */}
                <button
                  type="button"
                  onClick={() => highlightSingleItemOnMap(activeFacilities?.petrolPump, '⛽', '#D97706')}
                  className={`flex items-center gap-2 bg-paper p-2 rounded-xl border text-left transition-all group ${
                    selectedFacilityTitle === activeFacilities?.petrolPump?.title
                      ? 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-500/10 shadow-sm'
                      : 'border-ink/5 hover:border-amber-600/30 text-ink/70'
                  }`}
                >
                  <Fuel className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold text-ink group-hover:text-amber-700 truncate">
                      {activeFacilities?.petrolPump?.title || 'পেট্রোল পাম্প'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50 flex items-center gap-1">
                      <span>{activeFacilities?.petrolPump ? `${activeFacilities.petrolPump.distanceMeters}m` : '~৪৫০m'}</span>
                      <span className="text-amber-700 font-bold">📍 মানচিত্রে</span>
                    </div>
                  </div>
                </button>

                {/* ATM */}
                <button
                  type="button"
                  onClick={() => highlightSingleItemOnMap(activeFacilities?.atm, '💳', '#059669')}
                  className={`flex items-center gap-2 bg-paper p-2 rounded-xl border text-left transition-all group ${
                    selectedFacilityTitle === activeFacilities?.atm?.title
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-500/10 shadow-sm'
                      : 'border-ink/5 hover:border-emerald-600/30 text-ink/70'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold text-ink group-hover:text-emerald-700 truncate">
                      {activeFacilities?.atm?.title || 'এটিএম বুথ'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50 flex items-center gap-1">
                      <span>{activeFacilities?.atm ? `${activeFacilities.atm.distanceMeters}m` : '~২০০m'}</span>
                      <span className="text-emerald-700 font-bold">📍 মানচিত্রে</span>
                    </div>
                  </div>
                </button>

                {/* Hospital */}
                <button
                  type="button"
                  onClick={() => highlightSingleItemOnMap(activeFacilities?.hospital, '🏥', '#8B1E2D')}
                  className={`flex items-center gap-2 bg-paper p-2 rounded-xl border text-left transition-all group ${
                    selectedFacilityTitle === activeFacilities?.hospital?.title
                      ? 'border-bengali-red ring-2 ring-bengali-red/30 bg-bengali-red/10 shadow-sm'
                      : 'border-ink/5 hover:border-bengali-red/30 text-ink/70'
                  }`}
                >
                  <Hospital className="w-3.5 h-3.5 text-bengali-red flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold text-ink group-hover:text-bengali-red truncate">
                      {activeFacilities?.hospital?.title || 'হাসপাতাল / নার্সিং হোম'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50 flex items-center gap-1">
                      <span>{activeFacilities?.hospital ? `${activeFacilities.hospital.distanceMeters}m` : '~৩০০m'}</span>
                      <span className="text-bengali-red font-bold">📍 মানচিত্রে</span>
                    </div>
                  </div>
                </button>

                {/* Pharmacy */}
                <button
                  type="button"
                  onClick={() => highlightSingleItemOnMap(activeFacilities?.pharmacy, '💊', '#7C3AED')}
                  className={`flex items-center gap-2 bg-paper p-2 rounded-xl border text-left transition-all group ${
                    selectedFacilityTitle === activeFacilities?.pharmacy?.title
                      ? 'border-purple-600 ring-2 ring-purple-500/30 bg-purple-500/10 shadow-sm'
                      : 'border-ink/5 hover:border-purple-600/30 text-ink/70'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold text-ink group-hover:text-purple-700 truncate">
                      {activeFacilities?.pharmacy?.title || 'ফার্মেসি / ওষুধের দোকান'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50 flex items-center gap-1">
                      <span>{activeFacilities?.pharmacy ? `${activeFacilities.pharmacy.distanceMeters}m` : '~২৫০m'}</span>
                      <span className="text-purple-700 font-bold">📍 মানচিত্রে</span>
                    </div>
                  </div>
                </button>

                {/* Public Toilet */}
                <button
                  type="button"
                  onClick={() => highlightSingleItemOnMap(activeFacilities?.toilet, '🚻', '#0284C7')}
                  className={`flex items-center gap-2 bg-paper p-2 rounded-xl border text-left transition-all group col-span-2 ${
                    selectedFacilityTitle === activeFacilities?.toilet?.title
                      ? 'border-sky-600 ring-2 ring-sky-500/30 bg-sky-500/10 shadow-sm'
                      : 'border-ink/5 hover:border-sky-600/30 text-ink/70'
                  }`}
                >
                  <Bath className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold text-ink group-hover:text-sky-700 truncate">
                      {activeFacilities?.toilet?.title || 'পাবলিক শৌচালয়'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/50 flex items-center gap-1">
                      <span>{activeFacilities?.toilet ? `${activeFacilities.toilet.distanceMeters}m` : '~১৫০m'}</span>
                      <span className="text-sky-700 font-bold">📍 মানচিত্রে</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Nearby Eateries & Cafes */}
            <div className="space-y-3 pt-1 border-t border-ink/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-serif font-bold text-bengali-red flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>কাছাকাছি রেস্তোরাঁ ও ক্যাফে</span>
                </h4>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                  hasEateries ? 'bg-emerald-500/10 text-emerald-800' : 'bg-amber-500/10 text-amber-800'
                }`}>
                  {hasEateries ? `${eateryData.within1km.length} টি (≤১km)` : `দূরবর্তী ${eateryData.relativelyFar.length} টি`}
                </span>
              </div>

              {!hasEateries && (
                <div className="flex items-start gap-1.5 p-2 bg-red-500/5 border border-red-500/15 rounded-xl text-red-900 text-[11px] font-serif">
                  <AlertCircle className="w-3.5 h-3.5 text-bengali-red flex-shrink-0 mt-0.5" />
                  <span>১ কিলোমিটারের মধ্যে কোনো ক্যাফে বা রেস্তোরাঁ পাওয়া যায়নি। কিছুটা দূরের তালিকা:</span>
                </div>
              )}

              <div className="space-y-2">
                {eateriesToShow.map((eatery, eIdx) => {
                  const isSelectedEatery = selectedFacilityTitle === eatery.title;

                  return (
                    <div
                      key={eIdx}
                      onClick={() => highlightSingleItemOnMap(eatery, '🍽️', '#B45309')}
                      className={`bg-paper p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 group ${
                        isSelectedEatery
                          ? 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-500/10 shadow-sm'
                          : 'border-ink/8 hover:border-bengali-red/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-serif font-bold text-ink text-xs truncate group-hover:text-bengali-red transition-colors">
                          {eatery.title}
                        </h5>
                        <span className="bg-amber-500/10 text-amber-900 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex-shrink-0">
                          {hasEateries ? `${eatery.distanceMeters}m` : `${(eatery.distanceMeters / 1000).toFixed(1)}km`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-ink/50 font-sans">
                        <span>{eatery.categoryName || 'Restaurant'}</span>
                        {eatery.totalScore && (
                          <span className="flex items-center gap-0.5 text-amber-700 font-mono font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            {eatery.totalScore.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="inline-flex items-center gap-1 text-[10px] text-bengali-red font-bold pt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>মানচিত্রে অবস্থান দেখুন →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PandalMap;
