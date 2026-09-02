import type { PandalNode } from './types';
import { getDistanceKm } from './distance';

export interface Cluster {
  id: string;
  centroidLat: number;
  centroidLon: number;
  pandalIds: Set<string>;
}

// Very simple radius-based clustering (connected components approach)
export function buildClusters(pandals: PandalNode[], radiusKm: number = 1.5): Cluster[] {
  const clusters: Cluster[] = [];
  const unassigned = new Set(pandals.map(p => p.id));
  const pandalMap = new Map(pandals.map(p => [p.id, p]));

  while (unassigned.size > 0) {
    // Pick the first unassigned pandal as a seed
    const seedId = Array.from(unassigned)[0];
    const clusterPandals = new Set<string>();
    const queue = [seedId];
    
    unassigned.delete(seedId);
    clusterPandals.add(seedId);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentPandal = pandalMap.get(currentId)!;

      // Find all unassigned neighbors within radius
      const neighbors = Array.from(unassigned).filter(id => {
        const p = pandalMap.get(id)!;
        return getDistanceKm(currentPandal.lat, currentPandal.lon, p.lat, p.lon) <= radiusKm;
      });

      for (const neighborId of neighbors) {
        unassigned.delete(neighborId);
        clusterPandals.add(neighborId);
        queue.push(neighborId);
      }
    }

    // Calculate centroid
    let sumLat = 0;
    let sumLon = 0;
    for (const id of clusterPandals) {
      const p = pandalMap.get(id)!;
      sumLat += p.lat;
      sumLon += p.lon;
    }

    clusters.push({
      id: `cluster_${clusters.length + 1}`,
      centroidLat: sumLat / clusterPandals.size,
      centroidLon: sumLon / clusterPandals.size,
      pandalIds: clusterPandals
    });
  }

  return clusters;
}
