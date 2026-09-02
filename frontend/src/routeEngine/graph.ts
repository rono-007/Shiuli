import type { PandalNode } from './types';
import { getDistanceKm } from './distance';

export interface GraphEdge {
  targetId: string;
  distanceKm: number;
}

export interface GraphNode {
  pandal: PandalNode;
  neighbors: GraphEdge[]; // Sorted by distance
  density1km: number;
  density500m: number;
}

export class ProximityGraph {
  private nodes: Map<string, GraphNode> = new Map();

  constructor(pandals: PandalNode[], maxNeighbors: number = 15) {
    this.buildGraph(pandals, maxNeighbors);
  }

  private buildGraph(pandals: PandalNode[], maxNeighbors: number) {
    // For a small dataset (< 5000), O(N^2) is acceptable for one-time initialization
    for (const p1 of pandals) {
      let edges: GraphEdge[] = [];
      let count500m = 0;
      let count1km = 0;

      for (const p2 of pandals) {
        if (p1.id === p2.id) continue;
        const dist = getDistanceKm(p1.lat, p1.lon, p2.lat, p2.lon);
        
        edges.push({ targetId: p2.id, distanceKm: dist });
        
        if (dist <= 0.5) count500m++;
        if (dist <= 1.0) count1km++;
      }

      // Sort by distance and keep top N
      edges.sort((a, b) => a.distanceKm - b.distanceKm);
      edges = edges.slice(0, maxNeighbors);

      this.nodes.set(p1.id, {
        pandal: p1,
        neighbors: edges,
        density500m: count500m,
        density1km: count1km
      });
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }
}
