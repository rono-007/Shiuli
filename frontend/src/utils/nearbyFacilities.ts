import { useState, useEffect } from 'react';

export interface NearbyMetroStation {
  id?: string;
  title: string;
  subTitle: string;
  line?: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  distanceText: string;
  estimatedWalkMinutes: number;
  url: string;
}

export interface NearbyFacility {
  id: string;
  title: string;
  subTitle?: string | null;
  categoryName?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  distanceMeters: number;
  distanceText: string;
  url: string;
  type?: 'metro' | 'hospital' | 'pharmacy' | 'toilet' | 'petrolPump' | 'atm' | 'police' | 'other';
}

export interface NearestFacilitiesGroup {
  metro: NearbyMetroStation | null;
  petrolPump: NearbyFacility | null;
  atm: NearbyFacility | null;
  hospital: NearbyFacility | null;
  pharmacy: NearbyFacility | null;
  toilet: NearbyFacility | null;
  police?: NearbyFacility | null;
}

// In-memory dataset caches
let facilitiesCache: any[] | null = null;
let metrosCache: any[] | null = null;
let loadPromise: Promise<[any[], any[]]> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

/**
 * Validates and normalizes latitude and longitude coordinates.
 * Rejects NaN, Infinity, null, undefined, out-of-range [-90..90, -180..180], and (0,0).
 */
export function validateCoordinates(lat: any, lng: any): { valid: boolean; lat: number; lng: number } {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { valid: false, lat: 0, lng: 0 };
  }
  const nLat = typeof lat === 'number' ? lat : Number(lat);
  const nLng = typeof lng === 'number' ? lng : Number(lng);

  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
    return { valid: false, lat: 0, lng: 0 };
  }
  if (nLat < -90 || nLat > 90 || nLng < -180 || nLng > 180) {
    return { valid: false, lat: 0, lng: 0 };
  }
  // Null Island check
  if (Math.abs(nLat) < 0.0001 && Math.abs(nLng) < 0.0001) {
    return { valid: false, lat: 0, lng: 0 };
  }
  return { valid: true, lat: nLat, lng: nLng };
}

/**
 * Preloads static facilities datasets into memory once.
 */
export async function preloadFacilitiesData(): Promise<[any[], any[]]> {
  if (facilitiesCache && metrosCache && facilitiesCache.length > 0) {
    return [facilitiesCache, metrosCache];
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const [northFRes, southFRes, mRes] = await Promise.all([
          fetch('/data/north_facilities_light.json'),
          fetch('/data/south_facilities_light.json'),
          fetch('/data/metro_stations.json')
        ]);

        let combinedFacilities: any[] = [];
        let combinedMetros: any[] = [];

        if (northFRes.ok) {
          const northF = await northFRes.json();
          if (Array.isArray(northF)) combinedFacilities.push(...northF);
        }
        if (southFRes.ok) {
          const southF = await southFRes.json();
          if (Array.isArray(southF)) combinedFacilities.push(...southF);
        }
        if (mRes.ok) {
          const mData = await mRes.json();
          if (Array.isArray(mData)) combinedMetros = mData;
        }

        facilitiesCache = combinedFacilities;
        metrosCache = combinedMetros;
        notifyListeners();
        return [facilitiesCache, metrosCache] as [any[], any[]];
      } catch (err) {
        console.warn('Failed to fetch facilities static JSON:', err);
        facilitiesCache = facilitiesCache || [];
        metrosCache = metrosCache || [];
        notifyListeners();
        return [facilitiesCache, metrosCache] as [any[], any[]];
      }
    })();
  }
  return loadPromise;
}

// Start preloading in background immediately upon module evaluation
if (typeof window !== 'undefined') {
  preloadFacilitiesData();
}

/**
 * Accurate Haversine Distance in meters
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formats distance cleanly (e.g., '350 m' or '1.4 km').
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Finds the nearest metro station to given coordinates.
 */
export function getNearestMetro(lat: number, lon: number): NearbyMetroStation | null {
  const list = metrosCache;
  const validPandal = validateCoordinates(lat, lon);
  if (!list || list.length === 0 || !validPandal.valid) return null;

  let closestMetro: NearbyMetroStation | null = null;
  let minDist = Infinity;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;

    const rawLat = item.location?.lat ?? item.lat;
    const rawLng = item.location?.lng ?? item.lon ?? item.lng;
    const valid = validateCoordinates(rawLat, rawLng);
    if (!valid.valid) continue;

    const dist = getDistanceMeters(validPandal.lat, validPandal.lng, valid.lat, valid.lng);
    if (dist < minDist) {
      minDist = dist;
      const title = item.title || item.name || 'Metro Station';
      const subTitle = item.subTitle || item.line || 'Kolkata Metro';
      const address = item.address || `${title}, Kolkata`;
      const walkMin = Math.max(1, Math.round(dist / 75)); // ~4.5 km/h

      closestMetro = {
        id: `metro-${i}-${valid.lat.toFixed(4)}-${valid.lng.toFixed(4)}`,
        title,
        subTitle,
        line: item.line,
        address,
        lat: valid.lat,
        lng: valid.lng,
        distanceMeters: dist,
        distanceText: formatDistance(dist),
        estimatedWalkMinutes: walkMin,
        url: `https://www.google.com/maps/search/?api=1&query=${valid.lat},${valid.lng}`
      };
    }
  }

  return closestMetro;
}

/**
 * Single source of truth calculation for nearest facilities across all categories.
 */
export function getNearestFacilities(lat: number, lon: number): NearestFacilitiesGroup {
  const rawFacilities = (facilitiesCache || []) as any[];
  const validPandal = validateCoordinates(lat, lon);

  if (!validPandal.valid) {
    return {
      metro: null,
      petrolPump: null,
      atm: null,
      hospital: null,
      pharmacy: null,
      toilet: null,
      police: null
    };
  }

  // 1. Closest metro station
  const closestMetro = getNearestMetro(validPandal.lat, validPandal.lng);

  let closestPetrol: NearbyFacility | null = null;
  let closestAtm: NearbyFacility | null = null;
  let closestHospital: NearbyFacility | null = null;
  let closestPharmacy: NearbyFacility | null = null;
  let closestToilet: NearbyFacility | null = null;
  let closestPolice: NearbyFacility | null = null;

  let minDistPetrol = Infinity;
  let minDistAtm = Infinity;
  let minDistHospital = Infinity;
  let minDistPharmacy = Infinity;
  let minDistToilet = Infinity;
  let minDistPolice = Infinity;

  // 2. Search general facilities dataset
  for (let i = 0; i < rawFacilities.length; i++) {
    const item = rawFacilities[i];
    if (!item) continue;

    const rawLat = item.location?.lat ?? item.lat;
    const rawLng = item.location?.lng ?? item.lon ?? item.lng;
    const valid = validateCoordinates(rawLat, rawLng);
    if (!valid.valid) continue;

    const dist = getDistanceMeters(validPandal.lat, validPandal.lng, valid.lat, valid.lng);
    const cat = (item.categoryName || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const subTitle = (item.subTitle || '').toLowerCase();
    const categories = Array.isArray(item.categories) ? item.categories.join(' ').toLowerCase() : '';
    const searchBlob = `${title} ${subTitle} ${cat} ${categories}`;

    const stableId = `fac-${i}-${valid.lat.toFixed(4)}-${valid.lng.toFixed(4)}`;

    const createFacilityObj = (type: NearbyFacility['type']): NearbyFacility => ({
      id: stableId,
      title: item.title,
      subTitle: item.subTitle,
      categoryName: item.categoryName,
      address: item.address,
      lat: valid.lat,
      lng: valid.lng,
      distanceMeters: dist,
      distanceText: formatDistance(dist),
      url: item.url || `https://www.google.com/maps/search/?api=1&query=${valid.lat},${valid.lng}`,
      type
    });

    // Petrol Pump / Gas Station
    if (dist < minDistPetrol && (cat.includes('gas station') || searchBlob.includes('petrol') || searchBlob.includes('fuel'))) {
      minDistPetrol = dist;
      closestPetrol = createFacilityObj('petrolPump');
    }

    // ATM / Bank
    if (dist < minDistAtm && (cat.includes('atm') || cat.includes('bank') || searchBlob.includes('atm'))) {
      minDistAtm = dist;
      closestAtm = createFacilityObj('atm');
    }

    // Hospital / Nursing Home / Medical Center
    if (dist < minDistHospital && (
      cat.includes('hospital') || cat.includes('nursing home') || cat.includes('emergency room') ||
      cat.includes('medical center') || searchBlob.includes('hospital') || searchBlob.includes('nursing home') || searchBlob.includes('medical center')
    )) {
      minDistHospital = dist;
      closestHospital = createFacilityObj('hospital');
    }

    // Pharmacy / Chemist / Medicine Shop
    if (dist < minDistPharmacy && (
      cat.includes('pharmacy') || cat.includes('drug store') || cat.includes('chemist') || searchBlob.includes('pharmacy') || searchBlob.includes('medicine')
    )) {
      minDistPharmacy = dist;
      closestPharmacy = createFacilityObj('pharmacy');
    }

    // Public Toilet / Washroom / Bathroom
    if (dist < minDistToilet && (
      cat.includes('bathroom') || cat.includes('toilet') || searchBlob.includes('toilet') || searchBlob.includes('washroom') || searchBlob.includes('sauchalay')
    )) {
      minDistToilet = dist;
      closestToilet = createFacilityObj('toilet');
    }

    // Police Station / Thana / Traffic Guard
    const isPoliceStation = (
      cat.includes('police station') ||
      cat.includes('state police') ||
      cat.includes('police department') ||
      cat.includes('traffic police') ||
      searchBlob.includes('police station') ||
      searchBlob.includes('thana') ||
      searchBlob.includes('traffic guard') ||
      searchBlob.includes('police outpost') ||
      searchBlob.includes('থানা') ||
      searchBlob.includes('ট্রাফিক গার্ড')
    );

    const isNonPoliceStation = (
      cat.includes('gas station') ||
      cat.includes('hospital') ||
      cat.includes('bus stop') ||
      cat.includes('tram stop') ||
      cat.includes('apartment') ||
      cat.includes('housing') ||
      title.includes('petrol') ||
      title.includes('hospital') ||
      title.includes('morgue') ||
      title.includes('barrack') ||
      title.includes('abasan')
    );

    if (dist < minDistPolice && isPoliceStation && !isNonPoliceStation) {
      minDistPolice = dist;
      closestPolice = createFacilityObj('police');
    }
  }

  return {
    metro: closestMetro,
    petrolPump: closestPetrol,
    atm: closestAtm,
    hospital: closestHospital,
    pharmacy: closestPharmacy,
    toilet: closestToilet,
    police: closestPolice
  };
}

/**
 * React hook to access nearby facilities with reactive updates when datasets finish preloading.
 */
export function useNearbyFacilities(pandalLat?: number | null, pandalLon?: number | null) {
  const [dataReady, setDataReady] = useState<boolean>(() => Boolean(facilitiesCache && metrosCache));

  useEffect(() => {
    if (facilitiesCache && metrosCache) {
      setDataReady(true);
      return;
    }

    const onDataLoaded = () => {
      setDataReady(true);
    };

    listeners.add(onDataLoaded);
    preloadFacilitiesData();

    return () => {
      listeners.delete(onDataLoaded);
    };
  }, []);

  const hasCoords = typeof pandalLat === 'number' && typeof pandalLon === 'number';
  const validPandal = hasCoords ? validateCoordinates(pandalLat, pandalLon) : { valid: false, lat: 0, lng: 0 };

  const facilities: NearestFacilitiesGroup | null = (dataReady && validPandal.valid)
    ? getNearestFacilities(validPandal.lat, validPandal.lng)
    : null;

  return {
    facilities,
    loading: !dataReady,
    hasCoords: validPandal.valid
  };
}
