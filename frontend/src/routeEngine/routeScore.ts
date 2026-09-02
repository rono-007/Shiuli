import type { GraphNode } from './graph';
import { ProximityGraph } from './graph';
import { getDistanceKm, getWalkingDistanceKm } from './distance';

const SCORE_WEIGHTS = {
  DISTANCE: 1.0,
  DENSITY_BONUS: 0.15,
  ISOLATION_PENALTY: 2.0,
  DEAD_END_PENALTY: 3.5,
  CONTINUATION_BONUS: 0.2,
  LANDMARK_BONUS: 0.5,
  ENDPOINT_PENALTY: 1.5,
};

const FAMOUS_KEYWORDS = [
  "bagbazar", "ekdalia", "chetla", "suruchi", "college square", 
  "mohammad ali", "santosh mitra", "ahiritola", "kumartuli", 
  "shovabazar", "sovabazar", "singhi park", "mudiali", 
  "ballygunge", "sreebhumi", "tridhara", "deshapriya", 
  "babu bagan", "jodhpur park", "66 pally"
];

export function scoreCandidate(
  candidateNode: GraphNode,
  currentLat: number,
  currentLon: number,
  visitedIds: Set<string>,
  _graph: ProximityGraph,
  endLat?: number,
  endLon?: number
): number {
  // 1. Distance Cost
  const haversineDist = getDistanceKm(currentLat, currentLon, candidateNode.pandal.lat, candidateNode.pandal.lon);
  const walkDist = getWalkingDistanceKm(haversineDist);
  
  let score = walkDist * SCORE_WEIGHTS.DISTANCE;

  // 2. Density Bonus
  // High density areas are preferred as they allow more pandals in less walking time.
  score -= (candidateNode.density1km * 0.05 + candidateNode.density500m * 0.1) * SCORE_WEIGHTS.DENSITY_BONUS;

  // 3. Landmark Bonus (Small secondary bonus if it's a famous puja)
  const isFamous = FAMOUS_KEYWORDS.some(k => candidateNode.pandal.name.toLowerCase().includes(k));
  if (isFamous) {
    score -= SCORE_WEIGHTS.LANDMARK_BONUS;
  }

  // 4. Look-ahead: Continuation and Isolation
  let validUnvisitedNeighbors = 0;
  let bestNextDist = Infinity;

  for (const edge of candidateNode.neighbors) {
    if (!visitedIds.has(edge.targetId)) {
      validUnvisitedNeighbors++;
      if (edge.distanceKm < bestNextDist) {
        bestNextDist = edge.distanceKm;
      }
    }
  }

  if (validUnvisitedNeighbors === 0) {
    score += SCORE_WEIGHTS.DEAD_END_PENALTY;
  } else if (validUnvisitedNeighbors > 3) {
    score -= SCORE_WEIGHTS.CONTINUATION_BONUS;
  }

  if (bestNextDist > 2.0 && validUnvisitedNeighbors > 0) {
    // The closest next pandal is quite far away
    score += (bestNextDist - 2.0) * SCORE_WEIGHTS.ISOLATION_PENALTY;
  }

  // 5. Endpoint Optimization
  // If we have a specific endpoint (like a start metro we need to return to), 
  // gently penalize moving far away from it if we are far along in the route.
  // (We don't do this aggressively early on, but it helps guide the end of the route).
  if (endLat !== undefined && endLon !== undefined) {
    const distToEnd = getDistanceKm(candidateNode.pandal.lat, candidateNode.pandal.lon, endLat, endLon);
    // Add a small penalty based on distance to the end point to naturally pull the route in that direction
    score += distToEnd * 0.1 * SCORE_WEIGHTS.ENDPOINT_PENALTY;
  }

  return score;
}
