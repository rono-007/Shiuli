import rawFacilities from '../data/north_other_facilities.json';
import rawMetros from '../data/metros.json';

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
  for (const item of rawMetros as any[]) {
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
  const dataset = rawFacilities as any[];

  for (const item of dataset) {
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
