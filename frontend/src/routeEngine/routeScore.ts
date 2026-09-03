import type { GraphNode } from './graph';
import { ProximityGraph } from './graph';
import { getDistanceKm, getWalkingDistanceKm } from './distance';

export const FAMOUS_PANDAL_BONUS = 0.6;

const SCORE_WEIGHTS = {
  DISTANCE: 1.0,
  DENSITY_BONUS: 0.15,
  ISOLATION_PENALTY: 2.0,
  DEAD_END_PENALTY: 3.5,
  CONTINUATION_BONUS: 0.2,
  FAMOUS_PANDAL_BONUS: FAMOUS_PANDAL_BONUS,
  LANDMARK_BONUS: FAMOUS_PANDAL_BONUS,
  ENDPOINT_PENALTY: 1.5,
};

const FAMOUS_KEYWORDS = [
  // =========================
  // NORTH KOLKATA
  // =========================

  "bagbazar",
  "baghbazar",

  "kumartuli",
  "kumartuli park",

  "ahiritola",
  "ahritola",

  "shobhabazar",
  "shovabazar",
  "sovabazar",

  "sovabazar rajbari",
  "shobhabazar rajbari",

  "tala prottoy",
  "tala prattoy",

  "tala",

  "sikdar bagan",
  "sikdarbagan",

  "hatibagan",
  "hatibagan sarbojanin",
  "hatibagan nabin pally",

  "nalin sarkar street",
  "nalin sarkar",

  "belgachia",
  "belgachhia",

  "chaltabagan",
  "chalta bagan",
  "chaltabagan lohapatty",
  "lohapatty",

  "simla sporting",
  "shimla sporting",
  "simla byam samity",

  "kashi bose lane",
  "kashi bose",

  "manicktala",
  "maniktala",

  "dumdum park",
  "dum dum park",

  "dumdum park bharat chakra",
  "bharat chakra",

  "sreebhumi",
  "sree bhumi",
  "sreebhumi sporting",

  "telengabagan",

  "paikpara",

  "laketown",

  "lake town",

  "sinthee",
  "sinthi",

  "kashipur",

  "chitpur",

  "ultadanga",

  "narkeldanga",

  // =========================
  // CENTRAL KOLKATA
  // =========================

  "college square",

  "mohammad ali park",
  "mohammad ali",

  "santosh mitra square",
  "santosh mitra",
  "lebutala",
  "lebu bagan",

  "singhi park",

  "bowbazar",

  "entally",

  "sealdah",

  "taltala",

  "park circus",

  "park circus maidan",

  "park circus united",

  "beliaghata",

  "kankurgachi",

  "phoolbagan",

  "phool bagan",

  "beadon street",

  "beadon",

  "jhamapukur",

  "jhamapukur sarbojanin",

  "ramdulal sarkar street",

  "ramdulal sarkar",

  "machuabazar",

  // =========================
  // SOUTH KOLKATA - ICONIC
  // =========================

  "ekdalia",
  "ekdalia evergreen",
  "ekdalia evergreen club",

  "deshapriya park",
  "deshapriya",

  "badamtala ashar sangha",
  "badamtala",

  "chetla agrani",
  "chetla agrani club",
  "chetla",

  "suruchi sangha",
  "suruchi",

  "mudiali",
  "mudiali club",

  "tridhara",
  "tridhara sammili",
  "tridhara sammilani",

  "66 pally",
  "66pally",

  "64 pally",

  "95 pally",

  "jodhpur park",
  "jodhpur park sarbojanin",

  "hindustan park",
  "hindusthan park",

  "hindusthan club",
  "hindustan club",

  "ballygunge cultural association",
  "ballygunge cultural",

  "ballygunge puja",

  "samaj sebi sangha",
  "samaj sebi",

  "singhi park",

  "maddox square",
  "maddox",

  "maddox square park",

  "shiv mandir",
  "shib mandir",

  "shibmandir",

  "falguni sangha",

  "21 pally",
  "ballygunge 21 pally",

  "ekush pally",
  "ekush pally sarbojanin",

  "ballygunge 21",

  // =========================
  // GARIAHAT / KASBA
  // =========================

  "bosepukur",
  "bose pukur",

  "bosepukur sitala mandir",
  "bose pukur sitala",

  "bosepukur talbagan",
  "bose pukur talbagan",

  "rajdanga",
  "rajdanga naba uday",

  "rajdanga naba uday sangha",

  "deshapriya park",

  "babubagan",
  "babu bagan",

  "babubagan club",

  "selimpur pally",
  "selimpur",

  "dhakuria",

  "lake pally",

  "santoshpur lake pally",

  "santoshpur",

  "santoshpur trikon park",
  "trikon park",

  "pally mangal samity",

  "jodhpur park",

  // =========================
  // NAKTALA / GARIA
  // =========================

  "naktala udayan sangha",
  "naktala udayan",

  "naktala",

  "naktala pally",

  "garia",

  "gariahat",

  "gariahat hindustan park",

  "ballygunge",

  // =========================
  // KALIGHAT / CHETLA
  // =========================

  "kalighat",

  "kalighat club",

  "kalighat nepali",
  "kalighat nepal bhattacharjee",
  "nepal bhattacharjee",

  "chetla",

  "chetla agrani",

  "66 pally",

  "badamtala",

  "badamtala ashar sangha",

  "deshapriya park",

  // =========================
  // BEHALA
  // =========================

  "behala natun dal",
  "natun dal",

  "behala natun sangha",
  "natun sangha",

  "behala club",

  "behala friends",

  "behala friends club",

  "behala 11 pally",
  "11 pally",

  "behala 11 pally youth association",

  "behala thakurpukur",
  "thakurpukur",

  "barisha club",

  "barisha",

  "barisha sarbojanin",

  "debdaru fatak",

  "behala tapoban",

  "tapoban",

  "behala",

  // =========================
  // HARIDEVPUR / TOLLYGUNGE
  // =========================

  "haridevpur",

  "haridevpur 41 pally",

  "haridevpur 95 pally",

  "tollygunge",

  "tollygunge club",

  "tollygunge railway colony",

  "regent park",

  "new alipore",

  "new alipore suruchi",

  // =========================
  // KHIDIRPUR / ALIPORE
  // =========================

  "alipore sarbojanin",

  "alipore",

  "khidirpur 25 pally",
  "khidirpur 25 pally club",

  "25 pally",

  "khidirpur",

  "kabitirtha",

  "kabitirtha puja",

  "mominpur",

  // =========================
  // EAST KOLKATA
  // =========================

  "arjunpur",

  "arjunpur amra sabai",

  "arjunpur naboday",

  "dumdum park",

  "dumdum park tarun sangha",

  "dumdum park tarun sangha",

  "baguiati",

  "baguiati central",

  "baguiati club",

  "salt lake",

  "salt lake fd block",

  "fd block",

  "fd block durga puja",

  "bidhannagar",

  "bidhannagar central",

  "lake town",

  "laketown adhibasi brindo",

  // =========================
  // OTHER WELL-KNOWN / ROUTE
  // =========================

  "trikon park",

  "surya sen street",

  "surya sen",

  "sanghasree",

  "sanghasree puja",

  "sanghasree",

  "mohammad ali park",

  "college square",

  "simla",

  "hatibagan",

  "bagbazar",

  "kumartuli",

  "ahiritola",

  "tala prottoy",

  "sreebhumi",

  "sikdar bagan",

  "chaltabagan",

  "kashi bose lane",

  "nalin sarkar",

  "santosh mitra",

  "college square",

  "ekdalia",

  "badamtala",

  "chetla agrani",

  "suruchi sangha",

  "mudiali",

  "tridhara",

  "deshapriya park",

  "jodhpur park",

  "66 pally",

  "bosepukur",

  "rajdanga",

  "naktala udayan",

  "maddox square",

  "hindustan park",

  "ballygunge cultural",
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

  // 3. Famous Pandal Bonus
  const isFamous = FAMOUS_KEYWORDS.some(k => candidateNode.pandal.name.toLowerCase().includes(k));
  if (isFamous) {
    score -= FAMOUS_PANDAL_BONUS;
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
