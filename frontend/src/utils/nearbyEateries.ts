let eateriesCache: any[] | null = null;
let eateriesPromise: Promise<any[]> | null = null;

export async function getEateriesData(): Promise<any[]> {
  if (eateriesCache) return eateriesCache;
  if (!eateriesPromise) {
    eateriesPromise = Promise.all([
      import('../data/north_eateries.json').then(m => ((m.default || m) as any[])).catch(() => []),
      import('../data/south_eateries.json').then(m => ((m.default || m) as any[])).catch(() => [])
    ]).then(([north, south]) => [...north, ...south]);
  }
  eateriesCache = await eateriesPromise;
  return eateriesCache || [];
}

// Pre-trigger background load
getEateriesData().catch(() => {});

interface NearbyEatery {
  title: string;
  subTitle?: string | null;
  categoryName?: string | null;
  totalScore?: number | null;
  reviewsCount?: number | null;
  price?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  lat: number;
  lng: number;
  distanceMeters: number;
  walkMinutes: number;
}

export interface EateryResult {
  within1km: NearbyEatery[];
  relativelyFar: NearbyEatery[];
}

function getHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Exclude fast food stalls, street food, rolls, kiosks, tea stalls
function isProperRestaurantOrCafe(item: any): boolean {
  const cat = (item.categoryName || '').toLowerCase();
  const title = (item.title || '').toLowerCase();

  // Excluded terms
  const excludedKeywords = ['fast food', 'stall', 'street food', 'kiosk', 'snack bar', 'food stand', 'dhaba', 'tea stall', 'chai'];
  for (const kw of excludedKeywords) {
    if (cat.includes(kw) || title.includes(kw)) {
      return false;
    }
  }

  return true;
}

export function getNearestEateriesWithFallback(lat: number, lon: number, limit = 5): EateryResult {
  const dataset = (eateriesCache || []) as any[];
  if (dataset.length === 0) {
    getEateriesData(); // Trigger load if not ready
  }

  const mapped = dataset
    .filter(item => 
      item && 
      item.location && 
      typeof item.location.lat === 'number' && 
      typeof item.location.lng === 'number' &&
      isProperRestaurantOrCafe(item)
    )
    .map(item => {
      const eLat = item.location.lat;
      const eLng = item.location.lng;
      const dist = getHaversineDistanceMeters(lat, lon, eLat, eLng);
      return {
        title: item.title,
        subTitle: item.subTitle,
        categoryName: item.categoryName,
        totalScore: item.totalScore,
        reviewsCount: item.reviewsCount,
        price: item.price,
        address: item.address,
        imageUrl: item.imageUrl,
        lat: eLat,
        lng: eLng,
        url: `https://www.google.com/maps/search/?api=1&query=${eLat},${eLng}`,
        distanceMeters: dist,
        walkMinutes: Math.max(1, Math.ceil(dist / 80))
      };
    });

  mapped.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const within1km = mapped.filter(item => item.distanceMeters <= 1000).slice(0, limit);
  const relativelyFar = within1km.length === 0 ? mapped.slice(0, 3) : [];

  return {
    within1km,
    relativelyFar
  };
}
