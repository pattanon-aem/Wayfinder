/**
 * Calculate bearing (direction) between two geographic points
 * @param lat1 Starting latitude
 * @param lng1 Starting longitude
 * @param lat2 Ending latitude
 * @param lng2 Ending longitude
 * @returns Bearing in degrees (0-360, where 0 is North, 90 is East, etc.)
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (toDeg(θ) + 360) % 360;

  return bearing;
}

/**
 * Interface for tracking taxi positions with bearing
 */
export interface TaxiWithBearing {
  Latitude: number;
  Longitude: number;
  bearing?: number; // Direction in degrees (0-360)
}

/**
 * Calculate bearing for taxis by comparing with previous positions
 * @param currentTaxis Current taxi positions
 * @param previousTaxis Previous taxi positions (from last fetch)
 * @returns Taxis with bearing information
 */
export function calculateTaxiBearings(
  currentTaxis: Array<{ Latitude: number; Longitude: number }>,
  previousTaxis: Array<{ Latitude: number; Longitude: number }>
): TaxiWithBearing[] {
  // Create a map of previous positions for quick lookup
  // We'll use a simple proximity match (within ~20 meters)
  const MATCH_THRESHOLD = 0.0002; // roughly 20 meters in lat/lng

  return currentTaxis.map((current) => {
    // Find the closest previous taxi position
    let closestPrev = null;
    let closestDistance = Infinity;

    for (const prev of previousTaxis) {
      const distance = Math.sqrt(
        Math.pow(current.Latitude - prev.Latitude, 2) +
          Math.pow(current.Longitude - prev.Longitude, 2)
      );

      if (distance < closestDistance && distance < MATCH_THRESHOLD) {
        closestDistance = distance;
        closestPrev = prev;
      }
    }

    // If we found a matching previous position and the taxi has moved
    if (closestPrev && closestDistance > 0.00001) {
      const bearing = calculateBearing(
        closestPrev.Latitude,
        closestPrev.Longitude,
        current.Latitude,
        current.Longitude
      );

      return {
        ...current,
        bearing,
      };
    }

    // No previous position found or taxi hasn't moved significantly
    return current;
  });
}
