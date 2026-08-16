let facilitiesCache: any[] | null = null;
let metrosCache: any[] | null = null;
let loadPromise: Promise<[any[], any[]]> | null = null;

export async function preloadFacilitiesData(): Promise<[any[], any[]]> {
  if (facilitiesCache && metrosCache) return [facilitiesCache, metrosCache];
  if (!loadPromise) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';
    loadPromise = (async () => {
      try {
        const [northFRes, southFRes, mRes] = await Promise.all([
          fetch(`${baseUrl}/api/facilities/north`),
          fetch(`${baseUrl}/api/facilities/south`),
          fetch(`${baseUrl}/api/metro-stations`)
        ]);
        if (northFRes.ok && southFRes.ok && mRes.ok) {
          const northF = await northFRes.json();
          const southF = await southFRes.json();
          const mData = await mRes.json();
          if (Array.isArray(northF) && Array.isArray(southF) && Array.isArray(mData)) {
            return [[...northF, ...southF], mData] as [any[], any[]];
          }
        }
        throw new Error('API response invalid');
      } catch (err) {
        console.warn('Backend facilities fetch failed, loading local JSON fallbacks:', err);
        const [northF, southF, mData] = await Promise.all([
          import('../data/north_other_facilities.json').then(m => ((m.default || m) as any[])).catch(() => []),
          import('../data/south_other_facilities.json').then(m => ((m.default || m) as any[])).catch(() => []),
          import('../data/metros.json').then(m => m.default || m).catch(() => [])
        ]);
        return [[...northF, ...southF], mData] as [any[], any[]];
      }
    })();
  }
  const [fData, mData] = await loadPromise;
  facilitiesCache = fData;
  metrosCache = mData;
  return [fData, mData];
}

// Trigger background preload
preloadFacilitiesData().catch(() => {});

interface NearbyFacility {
  title: string;
  subTitle?: string | null;
  categoryName?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  distanceMeters: number;
  url: string;
}

export interface NearestFacilitiesGroup {
  metro: NearbyFacility | null;
  petrolPump: NearbyFacility | null;
  atm: NearbyFacility | null;
  hospital: NearbyFacility | null;
  pharmacy: NearbyFacility | null;
  toilet: NearbyFacility | null;
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getNearestFacilities(lat: number, lon: number): NearestFacilitiesGroup {
  const rawFacilities = (facilitiesCache || []) as any[];
  const rawMetros = (metrosCache || []) as any[];

  if (rawFacilities.length === 0 || rawMetros.length === 0) {
    preloadFacilitiesData();
  }

  let closestMetro: NearbyFacility | null = null;
  let closestPetrol: NearbyFacility | null = null;
  let closestAtm: NearbyFacility | null = null;
  let closestHospital: NearbyFacility | null = null;
  let closestPharmacy: NearbyFacility | null = null;
  let closestToilet: NearbyFacility | null = null;

  let minDistMetro = Infinity;
  let minDistPetrol = Infinity;
  let minDistAtm = Infinity;
  let minDistHospital = Infinity;
  let minDistPharmacy = Infinity;
  let minDistToilet = Infinity;

  // 1. Search metros.json for closest Kolkata Metro station
  for (const item of rawMetros) {
    if (!item || !item.location || typeof item.location.lat !== 'number' || typeof item.location.lng !== 'number') {
      continue;
    }
    const fLat = item.location.lat;
    const fLng = item.location.lng;
    const dist = getDistanceMeters(lat, lon, fLat, fLng);
    if (dist < minDistMetro) {
      minDistMetro = dist;
      closestMetro = {
        title: item.title,
        subTitle: item.subTitle || 'Metro Station',
        categoryName: '🚇 Metro Station',
        address: item.address,
        lat: fLat,
        lng: fLng,
        distanceMeters: dist,
        url: `https://www.google.com/maps/search/?api=1&query=${fLat},${fLng}`
      };
    }
  }

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
      url: `https://www.google.com/maps/search/?api=1&query=${fLat},${fLng}`
    };

    // Metro check
    if (dist < minDistMetro && (cat.includes('subway') || cat.includes('metro station') || searchBlob.includes('metro station') || searchBlob.includes('মেট্রো'))) {
      minDistMetro = dist;
      closestMetro = facility;
    }

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
