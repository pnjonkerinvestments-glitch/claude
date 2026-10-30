// Daily Road Trip (1.56): the points, kept apart from the route data so the game screen stays small.
export const ROAD_TRIP_START = 1000;
/** A step that takes you no closer to the finish. */
export const ROAD_TRIP_DETOUR = 150;
/** Every "Peek at the map" (3 seconds of borders). */
export const ROAD_TRIP_PEEK = 200;
/** Never fewer points than this once you arrive. */
export const ROAD_TRIP_MIN = 100;
/** How long a peek shows the borders, in milliseconds. */
export const ROAD_TRIP_PEEK_MS = 3000;

/** 1,000 − 150 per detour − 200 per peek, at least 100. No speed bonus. */
export function roadTripPoints(detours: number, peeks: number) {
  const d = Math.max(0, Math.floor(detours)), p = Math.max(0, Math.floor(peeks));
  return Math.max(ROAD_TRIP_MIN, Math.min(ROAD_TRIP_START, ROAD_TRIP_START - d * ROAD_TRIP_DETOUR - p * ROAD_TRIP_PEEK));
}
