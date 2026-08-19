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
  zone?: 'north' | 'south';
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
let isPreloading = false;
let preloadPromise: Promise<Eatery[]> | null = null;

const STORAGE_KEY = 'pujopoth_food_cache_v1';

// Initialize cache from sessionStorage if available
try {
  const cachedStr = sessionStorage.getItem(STORAGE_KEY);
  if (cachedStr) {
    foodCache = JSON.parse(cachedStr);
  }
} catch (e) {
  // Ignore sessionStorage errors
}

export function isFoodCacheReady(): boolean {
  return foodCache !== null && foodCache.length > 0;
}

export function startBackgroundPreload(baseUrl: string): Promise<Eatery[]> {
  if (isFoodCacheReady()) {
    return Promise.resolve(foodCache!);
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  isPreloading = true;

  const fetchTask = async (): Promise<Eatery[]> => {
    try {
      const res = await fetch(`${baseUrl}/api/food/all_light`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        foodCache = json.data;
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(foodCache));
        } catch (e) {
          // Exceeds quota or storage disabled, keep in memory only
        }
        return foodCache!;
      }
      throw new Error("Invalid response format");
    } catch (err) {
      console.warn("Background food preload deferred:", err);
      isPreloading = false;
      preloadPromise = null;
      return [];
    }
  };

  // Schedule low-priority execution
  preloadPromise = new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        fetchTask().then(resolve);
      });
    } else {
      setTimeout(() => {
        fetchTask().then(resolve);
      }, 300);
    }
  });

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
