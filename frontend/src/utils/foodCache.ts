export interface Eatery {
  id?: string;
  title: string;
  subTitle?: string | null;
  description?: string | null;
  price?: string | null;
  categoryName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  website?: string | null;
  location?: { lat: number; lng: number } | null;
  totalScore?: number | null;
  reviewsCount?: number | null;
  imageUrl?: string | null;
  url?: string | null;
  permanentlyClosed?: boolean;
  zone?: 'north' | 'south' | 'central';
}

interface QueryParams {
  page: number;
  limit: number;
  zone: string;
  category: string;
  minRating: number;
  search: string;
}

interface QueryResult {
  data: Eatery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

let foodCache: Eatery[] | null = null;
let preloadPromise: Promise<Eatery[]> | null = null;

const STORAGE_KEY = 'pujopoth_food_cache_v4';

// Initialize cache from sessionStorage if available
try {
  const cachedStr = sessionStorage.getItem(STORAGE_KEY);
  if (cachedStr) {
    const parsed = JSON.parse(cachedStr);
    // Ensure cache contains central zone data
    if (Array.isArray(parsed) && parsed.some(x => x.zone === 'central')) {
      foodCache = parsed;
    }
  }
} catch (e) {
  // Ignore sessionStorage errors
}

export function isFoodCacheReady(): boolean {
  return foodCache !== null && foodCache.length > 0 && foodCache.some(x => x.zone === 'central');
}

export function getLoadedFoodData(): Eatery[] | null {
  return foodCache;
}

export function getFoodCategories(zone: string): string[] {
  if (!foodCache) return ['All'];
  
  // Curated list of high-value categories for the UI chips
  const ALLOWED_CATEGORIES = new Set([
    'Bengali restaurant',
    'Cafe',
    'Coffee shop',
    'Biryani restaurant',
    'Mughlai restaurant',
    'Chinese restaurant',
    'South Indian restaurant',
    'North Indian restaurant',
    'Fast food restaurant',
    'Vegetarian restaurant',
    'Dessert shop',
    'Dessert restaurant',
    'Bakery',
    'Indian restaurant',
    'Continental restaurant',
    'Pizza restaurant',
    'Asian restaurant',
    'Italian restaurant',
    'Bistro',
    'Pub',
    'Bar & grill'
  ]);

  const categories = new Set<string>();
  foodCache.forEach(item => {
    if (zone !== 'all' && item.zone !== zone) return;
    if (item.categoryName && ALLOWED_CATEGORIES.has(item.categoryName)) {
      categories.add(item.categoryName);
    }
  });
  
  const sorted = Array.from(categories).sort();
  return ['All', ...sorted];
}

const fetchTask = async (): Promise<Eatery[]> => {
  try {
    const res = await fetch(`/data/eateries_light.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (Array.isArray(json)) {
      foodCache = json;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(foodCache));
      } catch (e) {
        // Exceeds quota or storage disabled, keep in memory only
      }
      return foodCache!;
    }
    throw new Error("Invalid response format");
  } catch (err) {
    console.warn("Food data fetch error:", err);
    preloadPromise = null;
    return [];
  }
};

export function getOrFetchEateries(): Promise<Eatery[]> {
  if (isFoodCacheReady()) {
    return Promise.resolve(foodCache!);
  }
  if (!preloadPromise) {
    preloadPromise = fetchTask();
  }
  return preloadPromise;
}

export function startBackgroundPreload(): Promise<Eatery[]> {
  if (isFoodCacheReady()) {
    return Promise.resolve(foodCache!);
  }
  if (!preloadPromise) {
    preloadPromise = fetchTask();
  }
  return preloadPromise;
}

export function queryLocalFood(params: QueryParams): QueryResult {
  if (!foodCache) {
    return {
      data: [],
      pagination: { page: params.page, limit: params.limit, total: 0, total_pages: 0 }
    };
  }

  const searchLower = params.search.toLowerCase().trim();
  const categoryLower = params.category.toLowerCase().trim();
  const searchTerms = searchLower ? searchLower.split(/\s+/) : [];

  const filtered = foodCache.filter((item) => {
    if (item.permanentlyClosed) return false;
    if (params.zone !== 'all' && item.zone !== params.zone) return false;
    if (params.minRating > 0 && (item.totalScore || 0) < params.minRating) return false;

    if (categoryLower !== 'all') {
      const cat = (item.categoryName || '').toLowerCase();
      if (!cat.includes(categoryLower)) return false;
    }

    if (searchTerms.length > 0) {
      const combinedText = (
        (item.title || '') + ' ' +
        (item.subTitle || '') + ' ' +
        (item.description || '') + ' ' +
        (item.address || '') + ' ' +
        (item.neighborhood || '') + ' ' +
        (item.categoryName || '')
      ).toLowerCase();

      const matchesAll = searchTerms.every((term) => combinedText.includes(term));
      if (!matchesAll) return false;
    }

    return true;
  });

  const total = filtered.length;
  const total_pages = Math.ceil(total / params.limit) || 1;
  const startIdx = (params.page - 1) * params.limit;
  const endIdx = startIdx + params.limit;

  const paginated = filtered.slice(startIdx, endIdx);

  return {
    data: paginated,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      total_pages
    }
  };
}
