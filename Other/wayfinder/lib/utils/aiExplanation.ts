export type TransportMode = "bus" | "car" | "taxi" | "walk" | "cycle";

export interface BusContext {
  summary?: string;
  // Structured options to aid the model: an array of per-option facts
  options?: Array<{
    id?: number;
    totalDurationMin?: number;
    inVehicleMin?: number;
    transfers?: number;
    walkingMin?: number;
    segments?: Array<{ route?: string; stops?: string[] }>;
    nearbyIncidents?: Array<{
      message: string;
      lat?: number | null;
      lon?: number | null;
      type?: string | null;
    }>;
  }>;
}

export interface CarContext {
  distance?: number;
  duration?: number;
  price?: number;
  parkingAvailability?: number;
  // optional detailed parking forecast for next minutes (keys: '15','30','45','60')
  parkingForecast?: Record<string, number>;
  carparkId?: string;
  incident?: string;
  roadworks?: string;
  tollPrice?: number;
}

export interface TaxiContext {
  distance?: number;
  duration?: number;
  estimatedPrice?: number;
  nearbyTaxis?: number;
  isPeakHour?: boolean;
  incident?: string;
  roadworks?: string;
  surgePricing?: boolean;
}

export interface WalkCycleContext {
  distance?: number;
  duration?: number;
  weatherCondition?: string;
  incident?: string;
}

export type TransportContext =
  | BusContext
  | CarContext
  | TaxiContext
  | WalkCycleContext;

export interface ExplainRequest {
  mode: TransportMode;
  context: TransportContext;
}

export interface ExplainResponse {
  response: string;
}

const API_BASE_URL = "/api/ai";

export async function getAIExplanation(
  mode: TransportMode,
  context: TransportContext
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        context,
      } as ExplainRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🤖 [AI] Error response body:", errorText);
      throw new Error(
        `API returned ${response.status}: ${response.statusText} - ${errorText}`
      );
    }

    const data: ExplainResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error("🤖 [AI] Fatal error:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("🤖 [AI] Network error - API might be down or unreachable");
      console.error("🤖 [AI] This could be due to:");
      console.error("  1. API is spinning up (cold start - wait 1 min)");
      console.error("  2. CORS issue");
      console.error("  3. Network connectivity issue");
      console.error("  4. API server is offline");
    }
    throw error;
  }
}
