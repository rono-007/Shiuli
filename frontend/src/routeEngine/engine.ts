import type { PandalItem, MetroStation, RoutePlanResponse, RoutePreferences, PandalNode, RouteStop } from './types';
import { ProximityGraph } from './graph';
import { runBeamSearch } from './beamSearch';
import { refineRouteTwoOpt } from './twoOpt';
import { calculateTravelInfo, getDistanceKm } from './distance';

export class RouteEngine {
  private pandals: PandalNode[] = [];
  private metros: MetroStation[] = [];
  private graph: ProximityGraph | null = null;
  private isInitialized = false;

  public initialize(pandalsData: PandalItem[], metrosData: MetroStation[]) {
    // Normalize and sanitize pandals
    this.pandals = pandalsData
      .filter(p => typeof p.lat === 'number' && typeof p.lon === 'number' && !isNaN(p.lat) && !isNaN(p.lon))
      .map(p => ({
        ...p,
        id: p.name.trim().toLowerCase() // Simple ID generation
      }));

    this.metros = metrosData;

    // Build the proximity graph locally (one-time cost)
    console.time('Graph Construction');
    this.graph = new ProximityGraph(this.pandals, 15);
    console.timeEnd('Graph Construction');
    
    this.isInitialized = true;
  }

  public generateRoute(prefs: RoutePreferences): RoutePlanResponse | null {
    if (!this.isInitialized || !this.graph) {
      console.error("RouteEngine is not initialized.");
      return null;
    }

    console.time('Route Generation Total');

    // 1. Establish Start Point
    let startLat = prefs.start_lat;
    let startLon = prefs.start_lon;
    
    // 2. Establish Time Budget
    const safetyBuffer = prefs.total_minutes <= 120 ? 15 : prefs.total_minutes <= 240 ? 25 : 40;
    const usableTime = Math.max(30, prefs.total_minutes - prefs.restaurant_break_minutes - safetyBuffer);

    // 3. Establish End Preferences
    let endLat: number | undefined;
    let endLon: number | undefined;

    if (prefs.end_preference === 'start_metro') {
      endLat = startLat;
      endLon = startLon;
    } else if (prefs.end_preference === 'nearest_metro' && this.metros.length > 0) {
      // Find a generally central metro or we can refine it during validation
      // We don't know the exact nearest until the route finishes, but we can't guide the beam perfectly.
      // We will skip guiding the beam for nearest_metro and let it happen organically.
    }

    // 4. Candidate Filtering
    // Filter out pandals that are simply way too far from the start to even be considered (e.g. > 15km)
    const MAX_START_DIST_KM = 15;
    let candidatePool = this.pandals.filter(p => {
      const d = getDistanceKm(startLat, startLon, p.lat, p.lon);
      return d <= MAX_START_DIST_KM;
    });

    if (candidatePool.length === 0) {
      candidatePool = this.pandals; // Fallback if everything was filtered
    }

    // 5. Run Beam Search Heuristic
    console.time('Beam Search');
    let bestRoutes = runBeamSearch(
      startLat, 
      startLon, 
      candidatePool, 
      this.graph, 
      25, // Absolute max pandals
      usableTime, 
      prefs.viewing_pace_minutes,
      endLat,
      endLon
    );
    console.timeEnd('Beam Search');

    if (bestRoutes.length === 0) {
      return null;
    }

    // Pick the best route
    let bestRoute = bestRoutes[0];

    // 6. 2-opt Refinement
    console.time('2-Opt Refinement');
    bestRoute = refineRouteTwoOpt(bestRoute);
    console.timeEnd('2-Opt Refinement');

    // 7. Finalize and Validate Route, build Response Stops
    console.time('Finalization');
    const finalStops: RouteStop[] = [];
    let currentLat = startLat;
    let currentLon = startLon;
    let cumulativeMin = 0;

    for (let i = 0; i < bestRoute.stops.length; i++) {
      const pandal = bestRoute.stops[i];
      const { timeMin } = calculateTravelInfo(currentLat, currentLon, pandal.lat, pandal.lon);
      
      const travelMin = timeMin;
      cumulativeMin += travelMin + prefs.viewing_pace_minutes;
      
      finalStops.push({
        name: pandal.name,
        address: pandal.address || `${pandal.name}, Kolkata`,
        lat: pandal.lat,
        lon: pandal.lon,
        estimated_travel_min: travelMin,
        cumulative_time_min: cumulativeMin
      });

      currentLat = pandal.lat;
      currentLon = pandal.lon;

      // Insert restaurant break in the middle
      if (prefs.restaurant_break_minutes > 0 && i === Math.floor(bestRoute.stops.length / 2)) {
        cumulativeMin += prefs.restaurant_break_minutes;
      }
    }

    // Endpoint Optimization
    if (prefs.end_preference === 'start_metro') {
      const { timeMin } = calculateTravelInfo(currentLat, currentLon, startLat, startLon);
      cumulativeMin += timeMin;
      finalStops.push({
        name: `${prefs.metro_station_name} (প্রস্থান / Exit)`,
        address: `প্রারম্ভিক মেট্রো স্টেশনে প্রত্যাবর্তন`,
        lat: startLat,
        lon: startLon,
        estimated_travel_min: timeMin,
        cumulative_time_min: cumulativeMin,
        is_metro: true
      });
    } else if (prefs.end_preference === 'nearest_metro' && this.metros.length > 0) {
      let nearestMetro = this.metros[0];
      let minDist = Infinity;
      for (const m of this.metros) {
        if (!m.lat || !m.lon) continue;
        const d = getDistanceKm(currentLat, currentLon, m.lat, m.lon);
        if (d < minDist) {
          minDist = d;
          nearestMetro = m;
        }
      }
      const { timeMin } = calculateTravelInfo(currentLat, currentLon, nearestMetro.lat, nearestMetro.lon);
      cumulativeMin += timeMin;
      finalStops.push({
        name: `${nearestMetro.name} Metro Station (সমাপ্তি / End)`,
        address: nearestMetro.address || `নিকটবর্তী মেট্রো স্টেশন`,
        lat: nearestMetro.lat,
        lon: nearestMetro.lon,
        estimated_travel_min: timeMin,
        cumulative_time_min: cumulativeMin,
        is_metro: true
      });
    }

    console.timeEnd('Finalization');
    console.timeEnd('Route Generation Total');

    return {
      start_metro: prefs.metro_station_name || 'কলকাতা মেট্রো',
      total_budget_min: prefs.total_minutes,
      usable_time_min: cumulativeMin,
      total_pandals: finalStops.filter(s => !s.is_metro).length,
      restaurant_break_included: prefs.restaurant_break_minutes > 0,
      end_preference: prefs.end_preference,
      stops: finalStops
    };
  }
}

// Export a singleton instance
export const routeEngine = new RouteEngine();
