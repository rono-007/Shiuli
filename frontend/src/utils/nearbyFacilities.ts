
export interface NearbyMetroStation {
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
  title: string;
  subTitle?: string | null;
  categoryName?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  distanceMeters: number;
  distanceText: string;
  url: string;
}

export interface NearestFacilitiesGroup {
  metro: NearbyMetroStation | null;
  petrolPump: NearbyFacility | null;
  atm: NearbyFacility | null;
  hospital: NearbyFacility | null;
  pharmacy: NearbyFacility | null;
  toilet: NearbyFacility | null;
}

let facilitiesCache: any[] | null = null;
let metrosCache: any[] = [];
let loadPromise: Promise<[any[], any[]]> | null = null;

export async function preloadFacilitiesData(): Promise<[any[], any[]]> {
  if (facilitiesCache && metrosCache.length > 0) return [facilitiesCache, metrosCache];
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const [northFRes, southFRes, mRes] = await Promise.all([
          fetch(`/data/north_facilities_light.json`),
          fetch(`/data/south_facilities_light.json`),
          fetch(`/data/metro_stations.json`)
        ]);
        if (northFRes.ok && southFRes.ok) {
          const northF = await northFRes.json();
          const southF = await southFRes.json();
          const mData = mRes.ok ? await mRes.json() : [];
          if (Array.isArray(northF) && Array.isArray(southF)) {
            const combinedFacilities = [...northF, ...southF];
            const finalMetros = Array.isArray(mData) && mData.length > 0 ? mData : [];
            return [combinedFacilities, finalMetros] as [any[], any[]];
          }
        }
        throw new Error('Static JSON response invalid or not found');
      } catch (err) {
        console.warn('Failed to fetch facilities static JSON:', err);
        return [[], []] as [any[], any[]];
      }
    })();
  }
  const [fData, mData] = await loadPromise;
  facilitiesCache = fData;
  metrosCache = mData && mData.length > 0 ? mData : [];
  return [facilitiesCache, metrosCache];
}

// Accurate Haversine Distance in meters
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

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function getNearestMetro(lat: number, lon: number): NearbyMetroStation | null {
  const list = metrosCache;
  if (!list || list.length === 0 || !lat || !lon) return null;

  let closestMetro: NearbyMetroStation | null = null;
  let minDist = Infinity;

  for (const item of list) {
    if (!item) continue;
    let mLat: number | null = null;
    let mLng: number | null = null;

    if (item.location && typeof item.location.lat === 'number' && typeof item.location.lng === 'number') {
      mLat = item.location.lat;
      mLng = item.location.lng;
    } else if (typeof item.lat === 'number' && (typeof item.lon === 'number' || typeof item.lng === 'number')) {
      mLat = item.lat;
      mLng = typeof item.lon === 'number' ? item.lon : item.lng;
    }

    if (mLat === null || mLng === null || isNaN(mLat) || isNaN(mLng)) continue;

    const dist = getDistanceMeters(lat, lon, mLat, mLng);
    if (dist < minDist) {
      minDist = dist;
      const title = item.title || item.name || 'Metro Station';
      const subTitle = item.subTitle || item.line || 'Kolkata Metro';
      const address = item.address || `${title}, Kolkata`;
      const walkMin = Math.max(1, Math.round(dist / 75)); // ~4.5 km/h walking speed

      closestMetro = {
        title,
        subTitle,
        line: item.line,
        address,
        lat: mLat,
        lng: mLng,
        distanceMeters: dist,
        distanceText: formatDistance(dist),
        estimatedWalkMinutes: walkMin,
        url: `https://www.google.com/maps/search/?api=1&query=${mLat},${mLng}`
      };
    }
  }

  return closestMetro;
}

export function getNearestFacilities(lat: number, lon: number): NearestFacilitiesGroup {
  const rawFacilities = (facilitiesCache || []) as any[];

  if (rawFacilities.length === 0) {
    preloadFacilitiesData();
  }

  // 1. Calculate closest metro from verified stations
  const closestMetro = getNearestMetro(lat, lon);

  let closestPetrol: NearbyFacility | null = null;
  let closestAtm: NearbyFacility | null = null;
  let closestHospital: NearbyFacility | null = null;
  let closestPharmacy: NearbyFacility | null = null;
  let closestToilet: NearbyFacility | null = null;

  let minDistPetrol = Infinity;
  let minDistAtm = Infinity;
  let minDistHospital = Infinity;
  let minDistPharmacy = Infinity;
  let minDistToilet = Infinity;

  // 2. Search general facilities dataset
  for (const item of rawFacilities) {
    if (!item || !item.location || typeof item.location.lat !== 'number' || typeof item.location.lng !== 'number') {
      continue;
    }

    const fLat = item.location.lat;
    const fLng = item.location.lng;
    const dist = getDistanceMeters(lat, lon, fLat, fLng);
    const cat = (item.categoryName || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const categories = (item.categories || []).join(' ').toLowerCase();
    const searchBlob = `${title} ${cat} ${categories}`;

    const facility: NearbyFacility = {
      title: item.title,
      subTitle: item.subTitle,
      categoryName: item.categoryName,
      address: item.address,
      lat: fLat,
      lng: fLng,
      distanceMeters: dist,
      distanceText: formatDistance(dist),
      url: `https://www.google.com/maps/search/?api=1&query=${fLat},${fLng}`
    };

    // Petrol Pump
    if (dist < minDistPetrol && (cat.includes('gas station') || searchBlob.includes('petrol') || searchBlob.includes('fuel'))) {
      minDistPetrol = dist;
      closestPetrol = facility;
    }

    // ATM
    if (dist < minDistAtm && (cat.includes('atm') || cat.includes('bank') || searchBlob.includes('atm'))) {
      minDistAtm = dist;
      closestAtm = facility;
    }

    // Hospital / Nursing Home
    if (dist < minDistHospital && (
      cat.includes('hospital') || cat.includes('nursing home') || cat.includes('emergency room') ||
      cat.includes('medical center') || searchBlob.includes('hospital') || searchBlob.includes('nursing home')
    )) {
      minDistHospital = dist;
      closestHospital = facility;
    }

    // Pharmacy
    if (dist < minDistPharmacy && (
      cat.includes('pharmacy') || cat.includes('chemist') || searchBlob.includes('pharmacy') || searchBlob.includes('medicine')
    )) {
      minDistPharmacy = dist;
      closestPharmacy = facility;
    }

    // Public Toilet
    if (dist < minDistToilet && (
      cat.includes('bathroom') || cat.includes('toilet') || searchBlob.includes('toilet') || searchBlob.includes('washroom') || searchBlob.includes('sauchalay')
    )) {
      minDistToilet = dist;
      closestToilet = facility;
    }
  }

  return {
    metro: closestMetro,
    petrolPump: closestPetrol,
    atm: closestAtm,
    hospital: closestHospital,
    pharmacy: closestPharmacy,
    toilet: closestToilet
  };
}
