import React, { useRef, useEffect, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getNearestEateries } from '../utils/nearbyEateries';

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

// Free CARTO Voyager raster basemap specification (reliable across all domains & Vercel)
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
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: KOLKATA_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      'top-right'
    );

    // Add geolocation control & watch position
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    });

    geolocate.on('geolocate', (e: any) => {
      const { longitude, latitude } = e.coords;
      setUserLocation([longitude, latitude]);
    });

    map.current.addControl(geolocate, 'top-right');

    const handleLoad = () => {
      setIsMapLoaded(true);
      map.current?.resize();

      // Trigger geolocation automatically if available
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

    // Safety timeout: ensure map loading overlay disappears even if style load event is delayed
    const safetyTimer = setTimeout(() => {
      setIsMapLoaded(true);
      map.current?.resize();
    }, 1500);

    // ResizeObserver to handle container size changes on Vercel/responsive layout
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

  // Add user location marker layer when userLocation changes
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

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter pandals based on search query
    const q = searchQuery.toLowerCase().trim();
    const filteredPandals = q
      ? pandals.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          (p.api_name && p.api_name.toLowerCase().includes(q))
        )
      : pandals;

    // Create markers for each pandal
    filteredPandals.forEach((pandal, idx) => {
      // Custom marker element
      const el = document.createElement('div');
      el.className = 'pandal-marker';
      el.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          background: #8B1E2D;
          border: 2.5px solid #FAF6ED;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(139, 30, 45, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        ">
          <span style="
            transform: rotate(45deg);
            color: #FAF6ED;
            font-size: 10px;
            font-weight: 700;
            font-family: monospace;
            line-height: 1;
          ">${String(idx + 1).padStart(2, '0')}</span>
        </div>
      `;

      // Hover effect
      el.addEventListener('mouseenter', () => {
        const inner = el.querySelector('div') as HTMLElement;
        if (inner) {
          inner.style.transform = 'rotate(-45deg) scale(1.2)';
          inner.style.boxShadow = '0 4px 16px rgba(139, 30, 45, 0.6)';
        }
      });
      el.addEventListener('mouseleave', () => {
        const inner = el.querySelector('div') as HTMLElement;
        if (inner) {
          inner.style.transform = 'rotate(-45deg) scale(1)';
          inner.style.boxShadow = '0 2px 8px rgba(139, 30, 45, 0.4)';
        }
      });

      // Create popup content
      const popupContent = `
        <div style="font-family: 'Tiro Bangla', 'Noto Serif Bengali', Georgia, serif; width: 250px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="
              background: rgba(139, 30, 45, 0.1);
              color: #8B1E2D;
              font-size: 10px;
              font-weight: 700;
              font-family: monospace;
              padding: 2px 7px;
              border-radius: 10px;
              letter-spacing: 0.05em;
              border: 1px solid rgba(139, 30, 45, 0.2);
            ">
              মণ্ডপ #${String(idx + 1).padStart(2, '0')}
            </span>
            <span style="
              font-size: 10px;
              color: #8B1E2D;
              font-weight: 600;
              opacity: 0.8;
            ">
              দুর্গাপুজো ২০২৬
            </span>
          </div>

          <h3 style="
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.35;
            margin: 0 0 6px 0;
          ">
            ${pandal.name}
          </h3>

          <div style="
            display: flex;
            align-items: flex-start;
            gap: 5px;
            font-size: 11px;
            color: #555;
            line-height: 1.45;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dashed rgba(139, 30, 45, 0.2);
          ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B1E2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>${pandal.address}</span>
          </div>

          {/* NEARBY EATERIES SECTION (Exact Coordinates & Proper Restaurants/Cafes Only) */}
          ${(() => {
            const eateries = getNearestEateries(pandal.lat, pandal.lon, 3);
            if (!eateries || eateries.length === 0) return '';
            return `
              <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed rgba(139, 30, 45, 0.2);">
                <div style="font-size: 10px; font-weight: 700; color: #8B1E2D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; items-center: center; gap: 4px;">
                  🍽️ কাছাকাছি রেস্তোরাঁ ও ক্যাফে (Nearby Restaurants & Cafes):
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  ${eateries.map(e => `
                    <div style="background: rgba(139, 30, 45, 0.04); border: 1px solid rgba(139, 30, 45, 0.1); padding: 5px 7px; border-radius: 6px; font-size: 10px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">
                          <span style="font-weight: 700; color: #1a1a1a;">${e.title}</span>
                          ${e.subTitle ? `<span style="color: #8B1E2D; font-size: 9px; margin-left: 3px;">(${e.subTitle})</span>` : ''}
                        </div>
                        <span style="background: rgba(217, 119, 6, 0.15); color: #b45309; padding: 1px 4px; border-radius: 4px; font-weight: 700; font-family: monospace; font-size: 9px; flex-shrink: 0;">
                          ${e.distanceMeters < 1000 ? `${e.distanceMeters}m` : `${(e.distanceMeters/1000).toFixed(1)}km`} (${e.walkMinutes} min)
                        </span>
                      </div>
                      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: #666;">
                        <span style="font-style: italic; color: #8B1E2D;">${e.categoryName || 'Restaurant'}</span>
                        <a href="https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}" target="_blank" rel="noopener noreferrer" style="color: #8B1E2D; font-weight: bold; text-decoration: underline;" title="GPS স্থানাঙ্ক দেখুন">
                          Google Maps GPS (${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}) ↗
                        </a>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          })()}

          <a
            href="https://www.google.com/maps/search/?api=1&query=${pandal.lat},${pandal.lon}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              background: #8B1E2D;
              color: #FAF6ED;
              padding: 7px 12px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
              text-decoration: none;
              box-shadow: 0 2px 8px rgba(139, 30, 45, 0.3);
            "
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            <span>Google Maps এ মণ্ডপটি দেখুন</span>
          </a>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '310px',
      }).setHTML(popupContent);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([pandal.lon, pandal.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if we have any and no specific pandal is selected
    if (filteredPandals.length > 0 && !selectedPandalName) {
      const bounds = new maplibregl.LngLatBounds();
      filteredPandals.forEach(p => bounds.extend([p.lon, p.lat]));
      map.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [pandals, isMapLoaded, searchQuery]);

  // Fly to selected pandal when it changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !selectedPandalName) return;

    const pandal = pandals.find(p => p.name === selectedPandalName);
    if (!pandal) return;

    // Close any existing popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    map.current.flyTo({
      center: [pandal.lon, pandal.lat],
      zoom: 16,
      duration: 1500,
      essential: true,
    });

    // Open the marker's popup after flying
    setTimeout(() => {
      const q = searchQuery.toLowerCase().trim();
      const filteredPandals = q
        ? pandals.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q) ||
            (p.api_name && p.api_name.toLowerCase().includes(q))
          )
        : pandals;

      const filteredIdx = filteredPandals.findIndex(p => p.name === selectedPandalName);
      if (filteredIdx >= 0 && markersRef.current[filteredIdx]) {
        markersRef.current[filteredIdx].togglePopup();
      }
    }, 1600);
  }, [selectedPandalName, isMapLoaded]);

  return (
    <div className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden">
      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />

      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-[#FAF6ED] flex flex-col items-center justify-center gap-4 z-10">
          <div className="w-10 h-10 border-4 border-bengali-red/20 border-t-bengali-red rounded-full animate-spin" />
          <p className="text-xs font-sans text-ink/50 italic">মানচিত্র লোড হচ্ছে...</p>
        </div>
      )}

      {/* Map legend */}
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
    </div>
  );
};

export default PandalMap;
