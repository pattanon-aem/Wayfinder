// OneMap API utilities for routing in Singapore

export type RoutingMode = "pt" | "drive" | "walk" | "cycle";

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  route: RoutePoint[];
  distance: number; // in meters
  duration: number; // in seconds
  instructions?: string[];
}

/**
 * Get route from OneMap routing API via our Next.js API route
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param mode Routing mode: 'pt' (public transport), 'drive', 'walk', or 'cycle'
 * @returns Route information including path coordinates
 */
export async function getRoute(
  start: RoutePoint,
  end: RoutePoint,
  mode: RoutingMode = "drive"
): Promise<RouteResult | null> {
  try {
    // Use our Next.js API route instead of calling OneMap directly
    const params = new URLSearchParams({
      start: `${start.lat},${start.lng}`,
      end: `${end.lat},${end.lng}`,
      routeType: mode,
    });

    const response = await fetch(`/api/routing/route?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Route API error:", errorData.error);
      return null;
    }

    const data = await response.json();

    // Check if route exists
    if (!data.route_geometry) {
      console.error("No route geometry found in response");
      return null;
    }

    // Parse the route geometry (encoded polyline)
    const routePoints = decodePolyline(data.route_geometry);

    return {
      route: routePoints,
      distance: data.route_summary?.total_distance || 0,
      duration: data.route_summary?.total_time || 0,
      instructions:
        data.route_instructions?.map((instr: any) => instr.text) || [],
    };
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
}

/**
 * Decode polyline string to array of coordinates
 * Based on Google's polyline encoding algorithm
 */
function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Search for locations using OneMap search API via our Next.js API route
 * @param query Search query string
 * @param returnGeom Whether to return geometry data (default: true)
 * @param getAddrDetails Whether to get address details (default: true)
 * @returns Array of search results
 */
export async function searchLocation(
  query: string,
  returnGeom: boolean = true,
  getAddrDetails: boolean = true
) {
  try {
    const params = new URLSearchParams({
      searchVal: query,
      returnGeom: returnGeom ? "Y" : "N",
      getAddrDetails: getAddrDetails ? "Y" : "N",
      pageNum: "1",
    });

    const response = await fetch(`/api/search/location?${params.toString()}`);

    if (!response.ok) {
      console.error("Search API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching location:", error);
    return [];
  }
}
