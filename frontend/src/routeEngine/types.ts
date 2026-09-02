export interface PandalItem {
  name: string;
  address?: string;
  lat: number;
  lon: number;
}

export interface MetroStation {
  name: string;
  api_name?: string;
  line?: string;
  address: string;
  lat: number;
  lon: number;
}

export interface RouteStop {
  name: string;
  address: string;
  lat: number;
  lon: number;
  estimated_travel_min: number;
  cumulative_time_min: number;
  is_food_break?: boolean;
  is_metro?: boolean;
}

export interface RoutePlanResponse {
  start_metro: string;
  total_budget_min: number;
  usable_time_min: number;
  total_pandals: number;
  restaurant_break_included: boolean;
  end_preference: string;
  stops: RouteStop[];
}

export interface RoutePreferences {
  region: string;
  metro_station_name: string;
  start_lat: number;
  start_lon: number;
  total_minutes: number;
  viewing_pace_minutes: number;
  restaurant_break_minutes: number;
  end_preference: string; // 'anywhere', 'nearest_metro', 'start_metro'
}

// Internal structures
export interface PandalNode extends PandalItem {
  id: string; // Internal id or normalized name
}

export interface Candidate extends PandalNode {
  distanceFromCurrent: number;
  score: number;
}

export interface PartialRoute {
  stops: PandalNode[];
  totalDistanceKm: number;
  totalTimeMin: number;
  currentLat: number;
  currentLon: number;
  visitedIds: Set<string>;
  score: number;
}
