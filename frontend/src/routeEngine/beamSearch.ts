import type { PartialRoute, PandalNode } from './types';
import { ProximityGraph } from './graph';
import { calculateTravelInfo } from './distance';
import { scoreCandidate } from './routeScore';

const BEAM_WIDTH = 8;
const MAX_CANDIDATES_PER_STEP = 20;

export function runBeamSearch(
  startLat: number,
  startLon: number,
  pool: PandalNode[],
  graph: ProximityGraph,
  maxPandals: number,
  maxTimeMin: number,
  viewingPaceMin: number,
  endLat?: number,
  endLon?: number
): PartialRoute[] {
  
  // 1. Generate Multiple Starting States (Multi-start)
  // We don't just start from the absolute closest pandal. We pick a few promising close ones.
  const startCandidates = pool.map(p => {
    const { walkingDist, timeMin } = calculateTravelInfo(startLat, startLon, p.lat, p.lon);
    return {
      pandal: p,
      walkingDist,
      timeMin
    };
  }).sort((a, b) => a.walkingDist - b.walkingDist).slice(0, BEAM_WIDTH);

  let beam: PartialRoute[] = startCandidates.map(c => ({
    stops: [c.pandal],
    totalDistanceKm: c.walkingDist,
    totalTimeMin: c.timeMin + viewingPaceMin,
    currentLat: c.pandal.lat,
    currentLon: c.pandal.lon,
    visitedIds: new Set([c.pandal.id]),
    score: c.walkingDist
  }));

  let completedRoutes: PartialRoute[] = [];

  // 2. Beam Search Expansion
  while (beam.length > 0) {
    const nextBeam: PartialRoute[] = [];
    
    for (const route of beam) {
      // Check if route is "complete" (hit max time or max pandals)
      if (route.stops.length >= maxPandals || route.totalTimeMin >= maxTimeMin) {
        completedRoutes.push(route);
        continue;
      }

      // Expand current route
      const currentNode = graph.getNode(route.stops[route.stops.length - 1].id);
      if (!currentNode) {
        completedRoutes.push(route);
        continue;
      }

      let expansions = 0;
      
      // Look at neighbors from the graph
      for (const edge of currentNode.neighbors) {
        if (route.visitedIds.has(edge.targetId)) continue;
        
        const nextNode = graph.getNode(edge.targetId);
        if (!nextNode) continue;

        // Verify time budget
        const { walkingDist, timeMin } = calculateTravelInfo(
          route.currentLat, 
          route.currentLon, 
          nextNode.pandal.lat, 
          nextNode.pandal.lon
        );
        
        const nextTime = route.totalTimeMin + timeMin + viewingPaceMin;
        if (nextTime > maxTimeMin) {
          continue; // Too far/takes too long
        }

        const candidateScore = scoreCandidate(
          nextNode,
          route.currentLat,
          route.currentLon,
          route.visitedIds,
          graph,
          endLat,
          endLon
        );

        const newVisited = new Set(route.visitedIds);
        newVisited.add(nextNode.pandal.id);

        nextBeam.push({
          stops: [...route.stops, nextNode.pandal],
          totalDistanceKm: route.totalDistanceKm + walkingDist,
          totalTimeMin: nextTime,
          currentLat: nextNode.pandal.lat,
          currentLon: nextNode.pandal.lon,
          visitedIds: newVisited,
          score: route.score + candidateScore
        });

        expansions++;
        if (expansions >= MAX_CANDIDATES_PER_STEP) break;
      }

      if (expansions === 0) {
        // Dead end, mark as complete
        completedRoutes.push(route);
      }
    }

    // Prune the beam
    // Sort ascending by score (lower is better)
    nextBeam.sort((a, b) => a.score - b.score);
    beam = nextBeam.slice(0, BEAM_WIDTH);
  }

  // If no routes completed naturally, add whatever is left in the beam
  completedRoutes.push(...beam);

  // Return the best completed routes
  completedRoutes.sort((a, b) => a.score - b.score);
  return completedRoutes;
}
