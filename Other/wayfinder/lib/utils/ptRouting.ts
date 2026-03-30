export interface PTItinerary {
  duration: number;
  walkTime: number;
  transitTime: number;
  waitingTime: number;
  walkDistance: number;
  transfers: number;
  fare?: string;
  legs: PTLeg[];
  startTime: number;
  endTime: number;
}

export interface PTLeg {
  mode: string;
  route?: string;
  routeShortName?: string;
  routeLongName?: string;
  from: PTStop;
  to: PTStop;
  intermediateStops?: PTStop[];
  duration: number;
  distance?: number;
  startTime: number;
  endTime: number;
  legGeometry?: {
    points: string;
    length: number;
  };
}

export interface PTStop {
  name: string;
  stopCode?: string;
  stopId?: string;
  lat?: number;
  lon?: number;
  arrival: number;
  departure: number;
}

export interface PTRouteResponse {
  plan: {
    itineraries: PTItinerary[];
    from: { name: string; lat: number; lon: number };
    to: { name: string; lat: number; lon: number };
    date: number;
  };
  requestParameters: any;
}

export async function getPTRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<PTRouteResponse | null> {
  try {
    const params = new URLSearchParams({
      start: `${start.lat},${start.lng}`,
      end: `${end.lat},${end.lng}`,
      routeType: "pt",
    });

    const response = await fetch(`/api/routing/route?${params.toString()}`);

    // Read response as text so we can safely handle non-JSON bodies (e.g., HTML error pages)
    const respText = await response.text();

    if (!response.ok) {
      // Try to extract JSON fields if present, otherwise include text snippet
      try {
        const errorData = JSON.parse(respText);
        const errorMessage = errorData.error || "PT Route API error";
        const errorDetails = errorData.details || "";
        const errorHint = errorData.hint || "";
        if (errorDetails) console.error("Error details:", errorDetails);
        if (errorHint) console.error("Hint:", errorHint);
        const fullError = `${errorMessage}${
          errorDetails ? "\n\n" + errorDetails : ""
        }${errorHint ? "\n\n" + errorHint : ""}`;
        throw new Error(fullError);
      } catch (parseErr) {
        // Not JSON — include a truncated response body to aid debugging
        const snippet = respText
          ? respText.slice(0, 2000)
          : "<no response body>";
        console.error(
          `PT Route API returned non-JSON error (status ${response.status}). Response snippet:\n`,
          snippet
        );
        throw new Error(
          `PT Route API returned status ${response.status}. Response begins: ${snippet}`
        );
      }
    }

    let data: any = null;
    try {
      data = JSON.parse(respText);
    } catch (parseErr) {
      const snippet = respText ? respText.slice(0, 2000) : "<no response body>";
      console.error(
        "Failed to parse PT route JSON response. Response snippet:",
        snippet
      );
      throw new Error(
        `Failed to parse PT route JSON response. Response begins: ${snippet}`
      );
    }

    if (
      data.plan &&
      Array.isArray(data.plan.itineraries) &&
      data.plan.itineraries.length > 0
    ) {
      return data as PTRouteResponse;
    }

    console.error("No PT itineraries found in response");
    return null;
  } catch (error) {
    console.error("Error fetching PT route:", error);
    // Re-throw the error so callers can handle specific upstream failures
    throw error;
  }
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getMinutesUntil(timestamp: number): number {
  const now = Date.now();
  const diff = timestamp - now;
  return Math.max(0, Math.floor(diff / 60000));
}

export function getBusLegs(itinerary: PTItinerary): PTLeg[] {
  return itinerary.legs.filter((leg) => leg.mode === "BUS");
}

export function getTotalDurationMinutes(itinerary: PTItinerary): number {
  return Math.round(itinerary.duration / 60);
}
