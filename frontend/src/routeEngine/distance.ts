// Distance calculation using Haversine Formula (in km)
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const ROUTE_CONSTANTS = {
  PEDESTRIAN_DETOUR_FACTOR: 1.35,
  WALKING_SPEED_KMH: 3.2, // ~18.75 min/km
  WALKING_MIN_PER_KM: 18.75,
  MIN_WALKING_TIME_MIN: 3, // For very close pandals
};

export function getWalkingDistanceKm(haversineDistanceKm: number): number {
  return haversineDistanceKm * ROUTE_CONSTANTS.PEDESTRIAN_DETOUR_FACTOR;
}

export function getWalkingTimeMin(walkingDistanceKm: number): number {
  return Math.max(
    ROUTE_CONSTANTS.MIN_WALKING_TIME_MIN,
    Math.round(walkingDistanceKm * ROUTE_CONSTANTS.WALKING_MIN_PER_KM)
  );
}

// Full calculation for convenience
export function calculateTravelInfo(lat1: number, lon1: number, lat2: number, lon2: number) {
  const haversineDist = getDistanceKm(lat1, lon1, lat2, lon2);
  const walkingDist = getWalkingDistanceKm(haversineDist);
  const timeMin = getWalkingTimeMin(walkingDist);
  return { haversineDist, walkingDist, timeMin };
}
