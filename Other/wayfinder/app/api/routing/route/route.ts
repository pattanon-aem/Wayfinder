import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

const ONEMAP_BASE_URL = "https://www.onemap.gov.sg/api/public/routingsvc/route";

const ONEMAP_TOKEN = process.env.ONEMAP_API_KEY || "";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);

  const start = searchParams.get("start"); // format: latitude,longitude
  const end = searchParams.get("end"); // format: latitude,longitude
  const routeType = searchParams.get("routeType") || "drive"; // drive, pt, walk, cycle
  const modeParam = searchParams.get("mode"); // optional OneMap 'mode' param for pt routes (TRANSIT/BUS/RAIL)

  if (!start || !end) {
    return NextResponse.json(
      { error: "Start and end coordinates are required" },
      { status: 400 }
    );
  }

  try {
    const oneMapMode =
      routeType === "pt"
        ? modeParam
          ? modeParam.toUpperCase()
          : "BUS"
        : undefined;

    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    let oneMapDate: string | undefined = undefined;
    let oneMapTime: string | undefined = undefined;
    if (routeType === "pt") {
      if (dateParam) {
        oneMapDate = dateParam;
      } else {
        const d = new Date();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const yyyy = String(d.getFullYear());
        oneMapDate = `${mm}-${dd}-${yyyy}`;
      }
      if (timeParam) {
        oneMapTime = timeParam;
      } else {
        const t = new Date();
        let hh = t.getHours();

        if (hh >= 0 && hh < 6) {
          hh = 8;
        }

        const hhStr = String(hh).padStart(2, "0");
        const min = String(t.getMinutes()).padStart(2, "0");
        const ss = String(t.getSeconds()).padStart(2, "0");
        oneMapTime = `${hhStr}:${min}:${ss}`; // HH:MM:SS
      }
    }

    // console.log("Routing request params:", {
    //   start,
    //   end,
    //   routeType,
    //   modeParam,
    //   oneMapMode,
    //   dateParam,
    //   oneMapDate,
    //   timeParam,
    //   oneMapTime,
    // });

    const url = `${ONEMAP_BASE_URL}?start=${start}&end=${end}&routeType=${routeType}${
      oneMapMode ? `&mode=${encodeURIComponent(oneMapMode)}` : ""
    }${oneMapDate ? `&date=${encodeURIComponent(oneMapDate)}` : ""}${
      oneMapTime ? `&time=${encodeURIComponent(oneMapTime)}` : ""
    }${ONEMAP_TOKEN ? `&token=${encodeURIComponent(ONEMAP_TOKEN)}` : ""}`;

    const headers: Record<string, string> = {
      accept: "application/json",
    };

    if (ONEMAP_TOKEN) {
      headers["authorization"] = `Bearer ${ONEMAP_TOKEN}`;
    }

    const response = await fetch(url, {
      headers,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(
        "OneMap API returned non-JSON response (HTML):",
        text.substring(0, 1000)
      );

      const isAuthError = text.includes("<!DOCTYPE") || text.includes("<html");
      const isDev = process.env.NODE_ENV !== "production";
      const snippet = text ? text.substring(0, 2000) : "<no body>";

      return NextResponse.json(
        {
          error: isAuthError
            ? "OneMap API Authentication Error"
            : "OneMap API returned invalid response",
          details: isDev ? snippet : undefined,
          hint: !ONEMAP_TOKEN
            ? "ONEMAP_API_KEY is not configured in environment variables"
            : "API key is configured but may be invalid or expired",
        },
        { status: 500 }
      );
    }

    const respBody = await response.text();
    let data: any;
    try {
      data = JSON.parse(respBody);
    } catch (parseErr) {
      console.error(
        "Failed to parse OneMap JSON response despite JSON content-type. Snippet:",
        respBody.substring(0, 2000)
      );
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json(
        {
          error: "OneMap API returned invalid JSON",
          details: isDev
            ? respBody
              ? respBody.substring(0, 2000)
              : "<no body>"
            : undefined,
          hint: !ONEMAP_TOKEN
            ? "ONEMAP_API_KEY is not configured in environment variables"
            : "API key is configured but upstream returned malformed data",
        },
        { status: 500 }
      );
    }

    const isPt = routeType === "pt";
    const hasPlanItineraries =
      data &&
      data.plan &&
      Array.isArray(data.plan.itineraries) &&
      data.plan.itineraries.length > 0;

    if (
      !response.ok ||
      data.status_message === "No solution found!" ||
      (!data.route_geometry && !(isPt && hasPlanItineraries))
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
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "Failed to fetch route from OneMap API",
        ...(isDev ? { details: String(error) } : {}),
        hint: !ONEMAP_TOKEN
          ? "ONEMAP_API_KEY is not configured in environment variables"
          : undefined,
      },
      { status: 500 }
    );
  }
}
