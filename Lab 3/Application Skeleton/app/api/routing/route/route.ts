import { NextResponse } from "next/server";

const ONEMAP_BASE_URL = "https://www.onemap.gov.sg/api/public/routingsvc/route";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const start = searchParams.get("start"); // format: latitude,longitude
  const end = searchParams.get("end"); // format: latitude,longitude
  const routeType = searchParams.get("routeType") || "drive"; // drive, pt, walk, cycle

  if (!start || !end) {
    return NextResponse.json(
      { error: "Start and end coordinates are required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${ONEMAP_BASE_URL}?start=${start}&end=${end}&routeType=${routeType}`,
      {
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    // Check if OneMap API returned an error
    if (
      !response.ok ||
      data.status_message === "No solution found!" ||
      !data.route_geometry
    ) {
      console.error("OneMap API error:", data);
      return NextResponse.json(
        { error: data.status_message || "No route found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { error: "Failed to fetch route from OneMap API" },
      { status: 500 }
    );
  }
}
