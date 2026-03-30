// OneMap API utilities for routing in Singapore
import { decodePolyline } from "@/lib/utils/mapUtils";

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
 *
 * NOTE: If your OneMap account requires an access token, it is handled
 * server-side by the Next.js API routes. Set `ONEMAP_TOKEN` or
 * `ONEMAP_API_KEY` in your deployment environment — do NOT put tokens in
 * client-side code. The client calls `/api/routing/route` and `/api/search/location`
 * which will forward the token to OneMap when present.
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

    // If OneMap returned a top-level encoded polyline (typical for drive/walk/cycle)
    if (data.route_geometry) {
      const routePoints = decodePolyline(data.route_geometry);
      return {
        route: routePoints,
        distance: data.route_summary?.total_distance || 0,
        duration: data.route_summary?.total_time || 0,
        instructions:
          data.route_instructions?.map((instr: any) => instr.text) || [],
      };
    }

    // If OneMap returned a public-transport plan (PT), it provides `plan.itineraries` with
    // per-leg `legGeometry.points`. Concatenate decoded leg geometries to build a route path.
    if (
      data.plan &&
      Array.isArray(data.plan.itineraries) &&
      data.plan.itineraries.length > 0
    ) {
      const itinerary = data.plan.itineraries[0];
      const legs = Array.isArray(itinerary.legs) ? itinerary.legs : [];

      const routePts: RoutePoint[] = [];
      let totalDistance = 0;
      const instructions: string[] = [];

      for (const leg of legs) {
        // accumulate distance if available
        if (typeof leg.distance === "number") totalDistance += leg.distance;

        // decode leg geometry if present
        if (leg.legGeometry && leg.legGeometry.points) {
          const legPoints = decodePolyline(leg.legGeometry.points);
          // avoid duplicating the first point if it matches the last
          if (routePts.length > 0 && legPoints.length > 0) {
            const last = routePts[routePts.length - 1];
            const firstLeg = legPoints[0];
            if (last.lat === firstLeg.lat && last.lng === firstLeg.lng) {
              routePts.push(...legPoints.slice(1));
            } else {
              routePts.push(...legPoints);
            }
          } else {
            routePts.push(...legPoints);
          }
        }

        // basic instruction text
        const routeName = leg.route || "";
        if (leg.mode === "WALK") {
          instructions.push(
            `Walk ${Math.round(leg.distance || 0)}m from ${
              leg.from?.name || ""
            } to ${leg.to?.name || ""}`
          );
        } else if (
          leg.mode === "BUS" ||
          leg.mode === "RAIL" ||
          leg.mode === "TRAM" ||
          leg.mode === "SUBWAY"
        ) {
          instructions.push(
            `${leg.mode} ${routeName} from ${leg.from?.name || ""} to ${
              leg.to?.name || ""
            }`
          );
        } else {
          instructions.push(
            `${leg.mode} from ${leg.from?.name || ""} to ${leg.to?.name || ""}`
          );
        }
      }

      return {
        route: routePts,
        distance: totalDistance,
        duration: itinerary.duration || 0,
        instructions,
      };
    }

    console.error("No route geometry or PT plan found in response");
    return null;
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
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
