import React, { useRef, useEffect, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

// Free CARTO Voyager basemap (warm vintage tone, no API key needed)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const PandalMap: React.FC<PandalMapProps> = ({ pandals, selectedPandalName, searchQuery }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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

    // Add compact attribution
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    // Add navigation controls (zoom +/-)
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      'top-right'
    );

    // Add geolocation control
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

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
        <div style="
          font-family: 'Noto Serif Bengali', Georgia, serif;
          max-width: 260px;
          padding: 4px;
        ">
          <div style="
            font-size: 11px;
            font-family: monospace;
            color: #8B1E2D;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-bottom: 4px;
            opacity: 0.7;
          ">NC${String(idx + 1).padStart(2, '0')}</div>
          <div style="
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 6px;
            line-height: 1.3;
          ">${pandal.name}</div>
          <div style="
            font-size: 11px;
            color: #666;
            line-height: 1.5;
            margin-bottom: 8px;
          ">${pandal.address}</div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=${pandal.lat},${pandal.lon}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              color: #8B1E2D;
              text-decoration: none;
              font-weight: 600;
              letter-spacing: 0.05em;
            "
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Google Maps এ দেখুন
          </a>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px',
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

    // Fly to the pandal
    map.current.flyTo({
      center: [pandal.lon, pandal.lat],
      zoom: 16,
      duration: 1500,
      essential: true,
    });

    // Open the marker's popup after flying
    setTimeout(() => {
      const idx = pandals.indexOf(pandal);
      if (idx >= 0) {
        // Find the corresponding marker in the filtered set
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
      <div className="absolute bottom-4 left-4 bg-[#FAF6ED]/95 backdrop-blur-sm border border-ink/10 rounded-xl px-4 py-3 z-10 shadow-md">
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
      </div>
    </div>
  );
};

export default PandalMap;
