import React, { useRef, useEffect, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MedicalFacilityMarker {
  title: string;
  subTitle?: string;
  categoryName?: string;
  type: string;
  address?: string;
  phone?: string;
  location: { lat: number; lng: number };
  url: string;
}

interface MedicalMapProps {
  facilities: MedicalFacilityMarker[];
  selectedFacility: MedicalFacilityMarker | null;
  onSelectFacility: (facility: MedicalFacilityMarker) => void;
  activeZone: 'north' | 'south';
}

const NORTH_CENTER: [number, number] = [88.365, 22.595];
const SOUTH_CENTER: [number, number] = [88.355, 22.525];

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

export const MedicalMap: React.FC<MedicalMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  activeZone,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // 1. Initialize Map with Geolocate, Navigation, Attribution Controls (Matching PandalMap)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter = activeZone === 'north' ? NORTH_CENTER : SOUTH_CENTER;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: 12.8,
      attributionControl: false,
      cooperativeGestures: true,
      dragRotate: false,
      touchPitch: false,
    });

    // Controls
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    });

    geolocate.on('geolocate', (e: any) => {
      const { longitude, latitude } = e.coords;
      setUserLocation([longitude, latitude]);
    });

    map.addControl(geolocate, 'top-left');
    mapInstanceRef.current = map;

    // Auto resize handling
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. User Location Halo Layer (Matching PandalMap)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    if (map.getSource('user-location-src')) {
      const src = map.getSource('user-location-src') as maplibregl.GeoJSONSource;
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: userLocation },
      });
      return;
    }

    map.addSource('user-location-src', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: userLocation },
      },
    });

    map.addLayer({
      id: 'user-location-halo',
      type: 'circle',
      source: 'user-location-src',
      paint: {
        'circle-radius': 18,
        'circle-color': '#2563EB',
        'circle-opacity': 0.25,
      },
    });

    map.addLayer({
      id: 'user-location-point',
      type: 'circle',
      source: 'user-location-src',
      paint: {
        'circle-radius': 8,
        'circle-color': '#2563EB',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#FFFFFF',
      },
    });
  }, [userLocation]);

  // 3. Fly to active zone center when zone changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const targetCenter = activeZone === 'north' ? NORTH_CENTER : SOUTH_CENTER;
    map.flyTo({ center: targetCenter, zoom: 12.8, duration: 1200 });
  }, [activeZone]);

  // 4. Render Custom PandalMap-style Markers with Interactive HTML Cards & Hover States
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    facilities.forEach(fac => {
      if (!fac.location || typeof fac.location.lat !== 'number' || typeof fac.location.lng !== 'number') return;

      const isHospital = fac.type.includes('Hospital');
      const isPharmacy = fac.type.includes('Pharmacy');
      const isPolice = fac.type.includes('Police');
      const isSelected = selectedFacility?.title === fac.title;

      let pinColor = '#10B981'; // Green for Ambulance
      let badgeLabel = 'Ambulance';
      let iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
      `;

      if (isHospital) {
        pinColor = '#E11D48'; // Rose
        badgeLabel = 'Hospital';
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>
        `;
      } else if (isPharmacy) {
        pinColor = '#8B5CF6'; // Purple
        badgeLabel = 'Pharmacy';
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
        `;
      } else if (isPolice) {
        pinColor = '#2563EB'; // Blue
        badgeLabel = 'Police';
        iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        `;
      }

      // Marker Container
      const el = document.createElement('div');
      el.className = 'medical-pandal-marker group';
      el.style.zIndex = isSelected ? '100' : '10';

      el.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
        ">
          <!-- Pulse Halo when Selected -->
          ${isSelected ? `
            <div style="
              position: absolute;
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background-color: ${pinColor};
              opacity: 0.35;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          ` : ''}

          <!-- Pin Head -->
          <div style="
            background: ${pinColor};
            color: white;
            padding: 8px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${iconSvg}
          </div>

          <!-- Label Tooltip -->
          <div style="
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-6px);
            white-space: nowrap;
            background: #1E293B;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-family: serif;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            pointer-events: none;
            display: ${isSelected ? 'block' : 'none'};
          ">
            ${fac.title}
          </div>
        </div>
      `;

      // MapLibre Interactive Popup
      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="font-family: serif; padding: 6px; max-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <span style="font-[900]; font-size: 13px; color: #111827;">${fac.title}</span>
            <span style="background: ${pinColor}15; color: ${pinColor}; border: 1px solid ${pinColor}30; padding: 2px 6px; border-radius: 99px; font-size: 9px; font-weight: bold; white-space: nowrap;">${badgeLabel}</span>
          </div>
          ${fac.address ? `<div style="font-size: 11px; color: #4B5563; line-height: 1.4; margin-bottom: 6px;">📍 ${fac.address}</div>` : ''}
          ${fac.phone ? `<div style="font-size: 11px; font-weight: font-bold; color: #1B4D3E; margin-bottom: 6px;">📞 ${fac.phone}</div>` : ''}
          <a href="${fac.url}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: ${pinColor}; color: white; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; text-decoration: none; margin-top: 4px;">Google Maps Navigation ↗</a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([fac.location.lng, fac.location.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onSelectFacility(fac);
      });

      markersRef.current.push(marker);
    });
  }, [facilities, selectedFacility, onSelectFacility]);

  // 5. Smooth Fly To selected facility when user clicks on a list card
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFacility || !selectedFacility.location) return;

    map.flyTo({
      center: [selectedFacility.location.lng, selectedFacility.location.lat],
      zoom: 15.5,
      duration: 1200,
    });
  }, [selectedFacility]);

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] md:min-h-[550px]" />
      
      {/* Interactive Map Floating Legend */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-200 shadow-md flex items-center justify-start sm:justify-center gap-3 text-xs font-serif z-10 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#E11D48]" />
          <span className="text-gray-700 font-bold">Hospitals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
          <span className="text-gray-700 font-bold">Pharmacies</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span className="text-gray-700 font-bold">Ambulance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
          <span className="text-gray-700 font-bold">Police</span>
        </div>
      </div>
    </div>
  );
};
