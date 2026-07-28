import React, { useState, useEffect } from 'react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MapRoute,
} from "./ui/map";

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

const KOLKATA_CENTER: [number, number] = [88.37, 22.60];
const DEFAULT_ZOOM = 12.5;
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const PandalMap: React.FC<PandalMapProps> = ({ pandals, selectedPandalName, searchQuery }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activePandalName, setActivePandalName] = useState<string | null>(selectedPandalName);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    setActivePandalName(selectedPandalName);
  }, [selectedPandalName]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );

    // Watch user position
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => console.warn('WatchPosition error:', err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );
    return () => {
      if (watchId !== undefined) navigator.geolocation?.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!activePandalName || !userLocation) {
      setRouteCoords([]);
      setRouteInfo(null);
      return;
    }

    const pandal = pandals.find(p => p.name === activePandalName);
    if (!pandal) return;

    const fetchRoute = async () => {
      const osrmServers = [
        `https://router.project-osrm.org/route/v1/driving/${userLocation[0]},${userLocation[1]};${pandal.lon},${pandal.lat}?overview=full&geometries=geojson`,
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${userLocation[0]},${userLocation[1]};${pandal.lon},${pandal.lat}?overview=full&geometries=geojson`,
      ];

      for (const osrmUrl of osrmServers) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(osrmUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) continue;

          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceKm = (route.distance / 1000).toFixed(1);
            const durationMin = Math.round(route.duration / 60);
            setRouteInfo({ distance: `${distanceKm} km`, duration: `${durationMin > 0 ? durationMin : 1} min` });
            setRouteCoords(route.geometry.coordinates as [number, number][]);
            return;
          }
        } catch (err) {
          console.warn('[Route] Server failed:', err);
        }
      }

      // Fallback
      const R = 6371000;
      const dLat = (pandal.lat - userLocation[1]) * Math.PI / 180;
      const dLon = (pandal.lon - userLocation[0]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLocation[1] * Math.PI / 180) * Math.cos(pandal.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      const distanceKm = (dist / 1000).toFixed(1);
      const durationSeconds = dist / 8.33;
      const durationMin = Math.round(durationSeconds / 60);

      setRouteInfo({ distance: `${distanceKm} km`, duration: `${durationMin > 0 ? durationMin : 1} min` });
      setRouteCoords([userLocation, [pandal.lon, pandal.lat]]);
    };

    fetchRoute();
  }, [activePandalName, userLocation, pandals]);

  const q = searchQuery.toLowerCase().trim();
  const filteredPandals = q
    ? pandals.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.api_name && p.api_name.toLowerCase().includes(q))
      )
    : pandals;

  return (
    <div className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden" style={{ minHeight: '500px' }}>
      <Map 
        viewport={{ center: KOLKATA_CENTER, zoom: DEFAULT_ZOOM, bearing: 0, pitch: 0 }}
        styles={{ light: MAP_STYLE, dark: MAP_STYLE }}
        loading
      >
        {routeCoords.length > 0 && (
          <MapRoute coordinates={routeCoords} color="#8B1E2D" width={5} opacity={0.95} />
        )}

        {userLocation && (
          <MapMarker longitude={userLocation[0]} latitude={userLocation[1]}>
            <MarkerContent>
              <div style={{
                width: 22, height: 22, background: '#1E88E5',
                border: '3px solid #FAF6ED', borderRadius: '50%',
                boxShadow: '0 0 12px rgba(30, 136, 229, 0.8)',
                animation: 'pulse 2s infinite'
              }} />
            </MarkerContent>
          </MapMarker>
        )}

        {filteredPandals.map((pandal, idx) => (
          <MapMarker 
            key={pandal.name} 
            longitude={pandal.lon} 
            latitude={pandal.lat}
            onClick={() => setActivePandalName(pandal.name)}
          >
            <MarkerContent>
              <div 
                className="group flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                style={{
                  width: 28, height: 28, background: '#8B1E2D',
                  border: '2.5px solid #FAF6ED', borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  boxShadow: '0 2px 8px rgba(139, 30, 45, 0.4)',
                }}
              >
                <span style={{
                  transform: 'rotate(45deg)', color: '#FAF6ED', fontSize: 10,
                  fontWeight: 700, fontFamily: 'monospace', lineHeight: 1
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
            </MarkerContent>
          </MapMarker>
        ))}
      </Map>

      {/* Map legend & Route info badge */}
      <div className="absolute bottom-4 left-4 bg-[#FAF6ED]/95 backdrop-blur-sm border border-ink/10 rounded-xl px-4 py-3 z-10 shadow-md space-y-2 pointer-events-none">
        <div className="flex items-center gap-2">
          <div style={{
            width: '14px', height: '14px', background: '#8B1E2D',
            borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
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
