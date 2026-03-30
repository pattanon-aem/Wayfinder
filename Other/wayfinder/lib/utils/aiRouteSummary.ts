import type { PTItinerary } from "@/lib/utils/ptRouting";

export interface BuiltOption {
  id: number;
  totalDurationMin: number;
  inVehicleMin: number;
  transfers: number;
  walkingMin: number;
  segments: { route: string; stops: string[] }[];
  nearbyIncidents?: any[];
}

function fmtStop(s: any): string {
  return (
    s?.name ||
    s?.stopName ||
    s?.stopCode ||
    s?.code ||
    s?.id ||
    s?.station ||
    "Stop"
  );
}

function buildSegments(it: PTItinerary): { route: string; stops: string[] }[] {
  const busLegs = it.legs.filter((leg: any) => leg.mode === "BUS");
  const segments: { route: string; stops: string[] }[] = [];

  for (const leg of busLegs) {
    const route = String(leg.route || "");
    const stops: string[] = [];

    if (leg.from) stops.push(fmtStop(leg.from));
    if (Array.isArray(leg.intermediateStops)) {
      for (const st of leg.intermediateStops) stops.push(fmtStop(st));
    }
    if (leg.to) stops.push(fmtStop(leg.to));

    // merge with previous if same route
    const last = segments[segments.length - 1];
    if (last && last.route === route) {
      // avoid duplicate boundary stop
      const merged = last.stops.concat(stops.slice(1));
      last.stops = Array.from(new Set(merged));
    } else {
      segments.push({ route, stops: Array.from(new Set(stops)) });
    }
  }

  return segments;
}

export function buildBusRouteSummary(
  itineraries: PTItinerary[],
  selectedItinerary: PTItinerary,
  getNearbyIncidents?: (it: PTItinerary) => any[]
): {
  optionTexts: string[];
  structuredOptions: BuiltOption[];
  fastestIdx: number;
  etas: number[];
} {
  const options: PTItinerary[] = [
    selectedItinerary,
    ...itineraries.filter((it) => it !== selectedItinerary).slice(0, 2),
  ];

  const etas = options.map((it) =>
    Math.round((it.endTime - it.startTime) / 1000 / 60)
  );
  const fastestIdx = etas.reduce(
    (minIdx, cur, i, arr) => (cur < arr[minIdx] ? i : minIdx),
    0
  );

  const optionTexts: string[] = [];
  const structuredOptions: BuiltOption[] = [];

  for (let idx = 0; idx < options.length; idx++) {
    const it = options[idx] as any;

    const segments = buildSegments(it);

    const transferWalkMins = Math.round((it.walkTime || 0) / 60) || 0; // walkTime generally in seconds
    const totalDuration = Math.round((it.endTime - it.startTime) / 1000 / 60);

    const busLegs = it.legs.filter((leg: any) => leg.mode === "BUS");
    const inVehicleMins = busLegs.reduce((sum: number, leg: any) => {
      const mins = Math.max(
        0,
        Math.round((leg.endTime - leg.startTime) / 1000 / 60)
      );
      return sum + mins;
    }, 0);

    const fastestLabel = idx === fastestIdx ? " — Fastest by ETA" : "";
    const selectedLabel = idx === 0 ? " — Selected" : "";
    const eta = etas[idx];

    const segLines = segments.map((s) => {
      const r = s.route ? `Service ${s.route}` : "Service";
      return `${r}: ${s.stops.join(" → ")}`;
    });

    const parts: string[] = [];
    parts.push(
      `Option ${
        idx + 1
      } (ETA ${eta} min)${fastestLabel}${selectedLabel}: Total duration ${totalDuration} min, in-vehicle ${inVehicleMins} min`
    );
    parts.push(
      `Transfers: ${it.transfers || 0} (walking ${transferWalkMins} min)`
    );
    parts.push(...segLines);

    optionTexts.push(parts.join(" | "));

    const nearby = getNearbyIncidents ? getNearbyIncidents(options[idx]) : [];

    structuredOptions.push({
      id: idx + 1,
      totalDurationMin: totalDuration,
      inVehicleMin: inVehicleMins,
      transfers: it.transfers || 0,
      walkingMin: transferWalkMins,
      segments: segments.map((s) => ({ route: s.route, stops: s.stops })),
      nearbyIncidents: nearby,
    });
  }

  return { optionTexts, structuredOptions, fastestIdx, etas };
}
