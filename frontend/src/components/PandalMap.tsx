import React, { useRef, useEffect, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getNearestEateriesWithFallback } from '../utils/nearbyEateries';
import { getNearestFacilities } from '../utils/nearbyFacilities';
import { MapPin, Navigation, Utensils, Star, AlertCircle, Fuel, CreditCard, Hospital, Bath, X, Layers, ExternalLink, Pill } from 'lucide-react';

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

const PandalMap: React.FC<PandalMapProps> = ({ pandals, selectedPandalName, searchQuery }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activePandal, setActivePandal] = useState<{ pandal: Pandal; idx: number } | null>(null);

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

    const safetyTimer = setTimeout(() => {
      setIsMapLoaded(true);
      map.current?.resize();
    }, 1500);

    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      clearTimeout(safetyTimer);
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

  // Add/update markers when pandals change or map loads
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

      // Click event: Select pandal and open right side card panel
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setActivePandal({ pandal, idx });

        if (map.current) {
          const isMobile = window.innerWidth < 768;
          map.current.flyTo({
            center: [pandal.lon, pandal.lat],
            zoom: 15.5,
            duration: 1000,
            padding: {
              right: isMobile ? 0 : 380,
              top: isMobile ? 200 : 20,
              bottom: 20,
              left: 20,
            },
            essential: true,
          });
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

    const isMobile = window.innerWidth < 768;
    map.current.flyTo({
      center: [pandal.lon, pandal.lat],
      zoom: 15.5,
      duration: 1200,
      padding: {
        right: isMobile ? 0 : 380,
        top: isMobile ? 200 : 20,
        bottom: 20,
        left: 20,
      },
      essential: true,
    });
  }, [selectedPandalName, isMapLoaded]);

  const activeFacilities = activePandal
    ? getNearestFacilities(activePandal.pandal.lat, activePandal.pandal.lon)
    : null;

  const eateryData = activePandal
    ? getNearestEateriesWithFallback(activePandal.pandal.lat, activePandal.pandal.lon, 6)
    : { within1km: [], relativelyFar: [] };

  const hasEateries = eateryData.within1km.length > 0;
  const eateriesToShow = hasEateries ? eateryData.within1km : eateryData.relativelyFar;

  return (
    <div className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden flex">
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />

      {/* Loading Overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-[#FAF6ED] flex flex-col items-center justify-center gap-4 z-10">
          <div className="w-10 h-10 border-4 border-bengali-red/20 border-t-bengali-red rounded-full animate-spin" />
          <p className="text-xs font-sans text-ink/50 italic">মানচিত্র লোড হচ্ছে...</p>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-[#FAF6ED]/95 backdrop-blur-sm border border-ink/10 rounded-xl px-4 py-3 z-10 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <div style={{
            width: '14px',
            height: '14px',
            background: '#8B1E2D',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            border: '1.5px solid #FAF6ED',
          }} />
          <span className="text-[10px] font-mono text-ink/60 tracking-wider uppercase">
            পুজো মণ্ডপ • {pandals.length} টি
          </span>
        </div>

        {userLocation && (
          <div className="flex items-center gap-2 border-t border-ink/10 pt-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1E88E5] border border-white" />
            <span className="text-[10px] font-mono text-[#1E88E5] font-semibold tracking-wider uppercase">
              আপনার অবস্থান (Your Location)
            </span>
          </div>
        )}
      </div>

      {/* RIGHT SIDE PANEL: Perfectly Fitted Details Card */}
      {activePandal && (
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[360px] md:w-[400px] bg-[#FAF6ED] border-l border-ink/15 shadow-2xl z-30 flex flex-col justify-between overflow-hidden animate-slide-in-right">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-bengali-red to-[#a02535] px-5 py-4 text-white flex items-center justify-between shadow-md flex-shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white tracking-widest flex-shrink-0">
                NC{String(activePandal.idx + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-serif font-bold text-white truncate">
                {activePandal.pandal.name}
              </h3>
            </div>
            <button
              onClick={() => setActivePandal(null)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors flex-shrink-0"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4 font-sans text-xs custom-scrollbar">
            
            {/* Address & Navigation */}
            <div className="bg-paper p-4 rounded-2xl border border-ink/10 space-y-3">
              <div className="flex items-start gap-2.5 text-ink/80">
                <MapPin className="w-4 h-4 text-bengali-red flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{activePandal.pandal.address}</span>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activePandal.pandal.lat},${activePandal.pandal.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-bengali-red text-white py-2.5 px-4 rounded-xl font-bold hover:bg-bengali-red/90 transition-colors shadow-sm text-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Google Maps এ মণ্ডপটি দেখুন ↗</span>
              </a>
            </div>

            {/* Facility Cards */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-serif font-bold text-ink/50 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" />
                জরুরি সুবিধাসমূহ (Real Nearby Facilities)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Petrol Pump */}
                <a
                  href={activeFacilities?.petrolPump?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2 rounded-xl border border-ink/5 hover:border-amber-600/30 text-ink/70 transition-all group"
                >
                  <Fuel className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-amber-700 truncate">
                      {activeFacilities?.petrolPump?.title || 'পেট্রোল পাম্প'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/40">
                      {activeFacilities?.petrolPump ? `${activeFacilities.petrolPump.distanceMeters}m` : '~৪৫০m'}
                    </div>
                  </div>
                </a>

                {/* ATM */}
                <a
                  href={activeFacilities?.atm?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2 rounded-xl border border-ink/5 hover:border-emerald-600/30 text-ink/70 transition-all group"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-emerald-700 truncate">
                      {activeFacilities?.atm?.title || 'এটিএম বুথ'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/40">
                      {activeFacilities?.atm ? `${activeFacilities.atm.distanceMeters}m` : '~২০০m'}
                    </div>
                  </div>
                </a>

                {/* Hospital */}
                <a
                  href={activeFacilities?.hospital?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2 rounded-xl border border-ink/5 hover:border-bengali-red/30 text-ink/70 transition-all group"
                >
                  <Hospital className="w-3.5 h-3.5 text-bengali-red flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-bengali-red truncate">
                      {activeFacilities?.hospital?.title || 'হাসপাতাল / নার্সিং হোম'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/40">
                      {activeFacilities?.hospital ? `${activeFacilities.hospital.distanceMeters}m` : '~৩০০m'}
                    </div>
                  </div>
                </a>

                {/* Pharmacy */}
                <a
                  href={activeFacilities?.pharmacy?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2 rounded-xl border border-ink/5 hover:border-purple-600/30 text-ink/70 transition-all group"
                >
                  <Pill className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-purple-700 truncate">
                      {activeFacilities?.pharmacy?.title || 'ফার্মেসি / ওষুধের দোকান'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/40">
                      {activeFacilities?.pharmacy ? `${activeFacilities.pharmacy.distanceMeters}m` : '~২৫০m'}
                    </div>
                  </div>
                </a>

                {/* Public Toilet */}
                <a
                  href={activeFacilities?.toilet?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-paper p-2 rounded-xl border border-ink/5 hover:border-sky-600/30 text-ink/70 transition-all group col-span-2"
                >
                  <Bath className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-serif font-bold group-hover:text-sky-700 truncate">
                      {activeFacilities?.toilet?.title || 'পাবলিক শৌচালয়'}
                    </div>
                    <div className="text-[9px] font-mono text-ink/40">
                      {activeFacilities?.toilet ? `${activeFacilities.toilet.distanceMeters}m` : '~১৫০m'}
                    </div>
                  </div>
                </a>
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
                {eateriesToShow.map((eatery, eIdx) => (
                  <div
                    key={eIdx}
                    className="bg-paper p-3 rounded-xl border border-ink/8 hover:border-bengali-red/30 transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-serif font-bold text-ink text-xs truncate">
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

                    <a
                      href={eatery.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-bengali-red font-bold hover:underline pt-0.5"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      Google Maps GPS ({eatery.lat.toFixed(4)}, {eatery.lng.toFixed(4)}) ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PandalMap;
