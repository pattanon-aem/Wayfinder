// Map utility functions

export const SINGAPORE_BOUNDS = {
  north: 1.47,
  south: 1.16,
  east: 104.04,
  west: 103.6,
};

export const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 };

// Radius for filtering nearby items (in km)
export const NEARBY_RADIUS_KM = 3;

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format time from minutes to readable string
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

// Estimate taxi fare (basic calculation)
export function estimateTaxiFare(distanceKm: number): number {
  const flagDownFare = 3.9;
  const perKmRate = 0.62;
  const estimatedFare = flagDownFare + distanceKm * perKmRate;
  return Math.round(estimatedFare * 100) / 100;
}

// Estimate bus fare (basic calculation)
export function estimateBusFare(distanceKm: number): number {
  // Basic bus fare structure in Singapore
  if (distanceKm <= 3.2) return 0.92;
  if (distanceKm <= 4.2) return 1.02;
  if (distanceKm <= 5.2) return 1.12;
  if (distanceKm <= 6.2) return 1.22;
  if (distanceKm <= 7.2) return 1.32;
  if (distanceKm <= 8.2) return 1.42;
  if (distanceKm <= 9.2) return 1.52;
  return 1.62 + Math.floor((distanceKm - 9.2) / 1) * 0.06;
}

export function decodePolyline(
  encoded: string
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// Check if coordinates are within Singapore bounds
export function isInSingapore(lat: number, lng: number): boolean {
  return (
    lat >= SINGAPORE_BOUNDS.south &&
    lat <= SINGAPORE_BOUNDS.north &&
    lng >= SINGAPORE_BOUNDS.west &&
    lng <= SINGAPORE_BOUNDS.east
  );
}

// Get nearest items by location
export function getNearestItems<
  T extends { Latitude: number; Longitude: number }
>(items: T[], userLat: number, userLng: number, limit: number = 5): T[] {
  return items
    .map((item) => ({
      item,
      distance: calculateDistance(
        userLat,
        userLng,
        item.Latitude,
        item.Longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((x) => x.item);
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
