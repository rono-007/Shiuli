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

// CARTO Voyager GL style URL — vector tiles with proper lifecycle events
// This is the same style mapcn uses; it fires load/style.load correctly
// so that addSource/addLayer work reliably on Vercel production.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const PandalMap: React.FC<PandalMapProps> = ({ pandals, selectedPandalName, searchQuery }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isStyleReady, setIsStyleReady] = useState(false);
  const routeSourceAddedRef = useRef(false);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [activePandalName, setActivePandalName] = useState<string | null>(selectedPandalName);

  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    setActivePandalName(selectedPandalName);
  }, [selectedPandalName]);

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
      positionOptions: { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 },
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
      console.log('[Map] load event fired');

      // Trigger geolocation automatically if available
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
      );
    };

    // style.load fires when GL style JSON + sprites/glyphs are ready
    // This is the correct event after which addSource/addLayer are safe
    const handleStyleLoad = () => {
      console.log('[Map] style.load event fired — sources/layers are now safe');
      setIsStyleReady(true);

      // Pre-add route source and layers so they exist before any pandal click
      if (map.current && !map.current.getSource('route-src')) {
        map.current.addSource('route-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.current.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route-src',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#1a1a1a', 'line-width': 8, 'line-opacity': 0.6 },
        });
        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-src',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#8B1E2D', 'line-width': 5, 'line-opacity': 0.95 },
        });
        routeSourceAddedRef.current = true;
        console.log('[Map] Pre-added route source + layers');
      }
    };

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => console.warn('WatchPosition error:', err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );

    map.current.on('load', handleLoad);
    map.current.on('style.load', handleStyleLoad);
    map.current.on('error', (e) => {
      console.warn('MapLibre error:', e);
      setIsMapLoaded(true);
    });

    // Safety timeout: ensure map loading overlay disappears even if style load event is delayed
    const safetyTimer = setTimeout(() => {
      setIsMapLoaded(true);
      map.current?.resize();
    }, 3000);

    // ResizeObserver to handle container size changes on Vercel/responsive layout
    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      if (watchId !== undefined) navigator.geolocation?.clearWatch(watchId);
      clearTimeout(safetyTimer);
      resizeObserver.disconnect();
      userMarkerRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add user location marker on map when userLocation changes
  useEffect(() => {
    if (!userLocation || !map.current) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-location-pin';
      el.innerHTML = `
        <div style="
          width: 22px;
          height: 22px;
          background: #1E88E5;
          border: 3px solid #FAF6ED;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(30, 136, 229, 0.8);
          animation: pulse 2s infinite;
        "></div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(userLocation)
        .addTo(map.current);
    } else {
      userMarkerRef.current.setLngLat(userLocation);
    }
  }, [userLocation, isMapLoaded]);

  // Fetch route and draw path on map when a pandal is selected
  // Uses the same pattern as mapcn's MapRoute: source+layers are pre-added
  // on style.load, so here we only update the source data.
  useEffect(() => {
    if (!map.current || !isStyleReady || !activePandalName || !userLocation) {
      // Clear route if no pandal or location
      if (map.current && routeSourceAddedRef.current) {
        try {
          (map.current.getSource('route-src') as any)?.setData({
            type: 'FeatureCollection',
            features: [],
          });
        } catch (_e) { /* ignore */ }
        setRouteInfo(null);
      }
      return;
    }

    const pandal = pandals.find(p => p.name === activePandalName);
    if (!pandal) return;

    console.log('[Route] Drawing route to:', pandal.name, 'from:', userLocation);

    const updateRouteSource = (geojson: any) => {
      const source = map.current?.getSource('route-src');
      if (source) {
        (source as any).setData(geojson);
        console.log('[Route] Updated route source data');
      } else {
        console.error('[Route] route-src source not found — this should not happen');
      }
    };

    const drawRouteOnMap = (geometry: any, distanceMeters: number, durationSeconds: number) => {
      const distanceKm = (distanceMeters / 1000).toFixed(1);
      const durationMin = Math.round(durationSeconds / 60);
      setRouteInfo({ distance: `${distanceKm} km`, duration: `${durationMin > 0 ? durationMin : 1} min` });

      updateRouteSource({
        type: 'Feature',
        properties: {},
        geometry: geometry,
      });

      // Fit map bounds to encompass user location and target pandal
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(userLocation);
      bounds.extend([pandal.lon, pandal.lat]);
      map.current!.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 16,
        duration: 1200,
      });
      console.log('[Route] Route drawn and map fitted to bounds');
    };

    const fetchRoute = async () => {
      // Try multiple OSRM servers for reliability
      const osrmServers = [
        `https://router.project-osrm.org/route/v1/driving/${userLocation[0]},${userLocation[1]};${pandal.lon},${pandal.lat}?overview=full&geometries=geojson`,
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${userLocation[0]},${userLocation[1]};${pandal.lon},${pandal.lat}?overview=full&geometries=geojson`,
      ];

      for (const osrmUrl of osrmServers) {
        try {
          console.log('[Route] Trying:', osrmUrl.split('/route/')[0]);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const res = await fetch(osrmUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) {
            console.warn('[Route] Server returned status:', res.status);
            continue;
          }

          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            console.log('[Route] Route found, distance:', route.distance);
            drawRouteOnMap(route.geometry, route.distance, route.duration);
            return;
          } else {
            console.warn('[Route] No routes returned');
          }
        } catch (err) {
          console.warn('[Route] Server failed:', err);
        }
      }

      // All OSRM servers failed — fallback to straight-line
      console.log('[Route] Fallback: drawing straight line');
      const R = 6371000;
      const dLat = (pandal.lat - userLocation[1]) * Math.PI / 180;
      const dLon = (pandal.lon - userLocation[0]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLocation[1] * Math.PI / 180) * Math.cos(pandal.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      drawRouteOnMap(
        { type: 'LineString', coordinates: [userLocation, [pandal.lon, pandal.lat]] },
        dist,
        dist / 8.33
      );
    };

    fetchRoute();
  }, [activePandalName, userLocation, isStyleReady, pandals]);

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
          ">${String(idx + 1).padStart(2, '0')}</div>
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

      // Click listener on marker to trigger route highlighting
      el.addEventListener('click', () => {
        setActivePandalName(pandal.name);
      });

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

  // Fly to selected pandal when it changes (if no route logic triggered)
  useEffect(() => {
    if (!map.current || !isMapLoaded || !selectedPandalName) return;

    const pandal = pandals.find(p => p.name === selectedPandalName);
    if (!pandal) return;

    // Close any existing popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (!userLocation) {
      map.current.flyTo({
        center: [pandal.lon, pandal.lat],
        zoom: 16,
        duration: 1500,
        essential: true,
      });
    }

    // Open the marker's popup after flying
    setTimeout(() => {
      const idx = pandals.indexOf(pandal);
      if (idx >= 0) {
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
  }, [selectedPandalName, isMapLoaded, userLocation]);

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

      {/* Map legend & Route info badge */}
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

        {routeInfo && (
          <div className="text-[10px] font-mono text-[#8B1E2D] font-bold bg-[#8B1E2D]/10 px-2 py-1 rounded border border-[#8B1E2D]/20">
            পথের দূরত্ব: {routeInfo.distance} (~{routeInfo.duration})
          </div>
        )}
      </div>
    </div>
  );
};

export default PandalMap;

