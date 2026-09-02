import type { PartialRoute } from './types';
import { getDistanceKm } from './distance';

const MAX_ITERATIONS = 50;

/**
 * Lightweight 2-opt refinement.
 * Attempts to swap pairs of edges to uncross paths and reduce total distance.
 */
export function refineRouteTwoOpt(route: PartialRoute): PartialRoute {
  if (route.stops.length <= 3) return route; // Nothing to optimize

  let improved = true;
  let iterations = 0;
  
  // Clone the stops array so we can modify it
  let currentStops = [...route.stops];

  while (improved && iterations < MAX_ITERATIONS) {
    improved = false;
    
    // Evaluate all pairs of edges (i, i+1) and (k, k+1)
    for (let i = 0; i < currentStops.length - 2; i++) {
      for (let k = i + 2; k < currentStops.length - 1; k++) {
        
        // Calculate current distance of these two edges
        const d1 = getDistanceKm(currentStops[i].lat, currentStops[i].lon, currentStops[i+1].lat, currentStops[i+1].lon);
        const d2 = getDistanceKm(currentStops[k].lat, currentStops[k].lon, currentStops[k+1].lat, currentStops[k+1].lon);
        const currentDist = d1 + d2;
        
        // Calculate distance if we reversed the segment between i+1 and k
        const d1_new = getDistanceKm(currentStops[i].lat, currentStops[i].lon, currentStops[k].lat, currentStops[k].lon);
        const d2_new = getDistanceKm(currentStops[i+1].lat, currentStops[i+1].lon, currentStops[k+1].lat, currentStops[k+1].lon);
        const newDist = d1_new + d2_new;
        
        // If the new distance is significantly shorter, perform the swap
        if (newDist < currentDist - 0.05) { // 50 meters improvement threshold to avoid micro-optimizations
          
          // Reverse the segment from i+1 to k
          const segment = currentStops.slice(i + 1, k + 1).reverse();
          currentStops = [
            ...currentStops.slice(0, i + 1),
            ...segment,
            ...currentStops.slice(k + 1)
          ];
          
          improved = true;
          break; // Break outer loop and restart the while loop
        }
      }
      if (improved) break;
    }
    iterations++;
  }

  // If we made improvements, we need to recalculate the total distance and time
  // However, for this heuristic, we assume the total distance is just shorter.
  // The route engine orchestrator will re-calculate exact timings during finalization.
  
  return {
    ...route,
    stops: currentStops
  };
}
