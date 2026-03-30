import { calculateDistance } from "./mapUtils";

export type Incident = {
  Latitude?: number;
  Longitude?: number;
  Message?: string;
  RoadName?: string;
  Type?: string;
  Timestamp?: string | number;
  [k: string]: any;
};

export type FilterOptions = {
  proximityMeters?: number; // default 500
  timeWindowMinutes?: number; // default 120
  roadNameAliases?: Record<string, string[]>;
};

export function normalizeRoadName(s: string | undefined) {
  if (!s) return "";
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function incidentMatchesRoad(
  incident: Incident,
  roadNames: string[],
  roadNameAliases?: Record<string, string[]>
) {
  const msg = (incident.Message || incident.message || "").toLowerCase();
  for (const rn of roadNames) {
    const norm = normalizeRoadName(rn);
    if (norm && msg.includes(norm)) return true;
    if (roadNameAliases && roadNameAliases[rn]) {
      for (const alias of roadNameAliases[rn]) {
        if (msg.includes(normalizeRoadName(alias))) return true;
      }
    }
  }
  if (incident.RoadName) {
    const incRoad = normalizeRoadName(incident.RoadName);
    for (const rn of roadNames)
      if (incRoad.includes(normalizeRoadName(rn))) return true;
  }
  return false;
}

// Simple filter: checks proximity to stop/leg endpoints and optional road-name match
export function filterIncidentsForItinerary(
  itinerary: any,
  incidents: Incident[],
  opts: FilterOptions = {}
) {
  const proximityMeters = opts.proximityMeters ?? 500;
  const now = Date.now();
  const timeWindowMs = (opts.timeWindowMinutes ?? 120) * 60 * 1000;

  // Collect coords from legs (from/to and intermediate stops if lat/lon present)
  const coords: { lat: number; lng: number }[] = [];
  for (const leg of itinerary.legs || []) {
    if (leg.mode !== "BUS") continue;
    if (leg.from && (leg.from.latitude || leg.from.lat || leg.from.Latitude)) {
      const lat = leg.from.latitude ?? leg.from.lat ?? leg.from.Latitude;
      const lng = leg.from.longitude ?? leg.from.lon ?? leg.from.Longitude;
      if (typeof lat === "number" && typeof lng === "number")
        coords.push({ lat, lng });
    }
    if (leg.to && (leg.to.latitude || leg.to.lat || leg.to.Latitude)) {
      const lat = leg.to.latitude ?? leg.to.lat ?? leg.to.Latitude;
      const lng = leg.to.longitude ?? leg.to.lon ?? leg.to.Longitude;
      if (typeof lat === "number" && typeof lng === "number")
        coords.push({ lat, lng });
    }
    if (Array.isArray(leg.intermediateStops)) {
      for (const s of leg.intermediateStops) {
        const lat = s.latitude ?? s.lat ?? s.Latitude;
        const lng = s.longitude ?? s.lon ?? s.Longitude;
        if (typeof lat === "number" && typeof lng === "number")
          coords.push({ lat, lng });
      }
    }
  }

  const routeNames = (itinerary.legs || [])
    .map((l: any) => l.route || l.routeShortName)
    .filter(Boolean);

  const matched: Incident[] = [];

  for (const inc of incidents || []) {
    // Temporal filter: if timestamp exists, drop incidents way beyond time window
    const tVal = inc.Timestamp ?? inc.timestamp ?? inc.time;
    if (tVal) {
      const t = typeof tVal === "number" ? tVal : Date.parse(String(tVal));
      if (!isNaN(t)) {
        if (t > now + timeWindowMs) continue;
      }
    }

    let close = false;
    if (typeof inc.Latitude === "number" && typeof inc.Longitude === "number") {
      for (const c of coords) {
        const dKm = calculateDistance(
          c.lat,
          c.lng,
          inc.Latitude,
          inc.Longitude
        );
        const dMeters = dKm * 1000;
        if (dMeters <= proximityMeters) {
          close = true;
          break;
        }
      }
    }

    const textMatch = incidentMatchesRoad(
      inc,
      routeNames,
      opts.roadNameAliases
    );

    if (close || textMatch) matched.push(inc);
  }

  // Deduplicate by message prefix
  const unique = Array.from(
    new Map(
      matched.map((m) => [(m.Message || m.message || "").slice(0, 120), m])
    ).values()
  );

  // Score: prefer those with distance if available
  unique.sort((a, b) => {
    const aDist =
      a.Latitude !== undefined && a.Longitude !== undefined && coords.length
        ? coords.reduce(
            (m, d) =>
              Math.min(
                m,
                calculateDistance(
                  d.lat,
                  d.lng,
                  Number(a.Latitude),
                  Number(a.Longitude)
                )
              ),
            Infinity
          )
        : Infinity;
    const bDist =
      b.Latitude !== undefined && b.Longitude !== undefined && coords.length
        ? coords.reduce(
            (m, d) =>
              Math.min(
                m,
                calculateDistance(
                  d.lat,
                  d.lng,
                  Number(b.Latitude),
                  Number(b.Longitude)
                )
              ),
            Infinity
          )
        : Infinity;
    return aDist - bDist;
  });

  return unique.slice(0, 4).map((u) => ({
    message: u.Message || u.message || JSON.stringify(u),
    lat: u.Latitude ?? u.latitude ?? null,
    lon: u.Longitude ?? u.longitude ?? null,
    type: u.Type || u.type || null,
  }));
}

export default filterIncidentsForItinerary;
