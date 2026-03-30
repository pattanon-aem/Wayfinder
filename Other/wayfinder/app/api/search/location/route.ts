import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

const ONEMAP_BASE_URL = "https://www.onemap.gov.sg/api/common/elastic/search";

// Optional server-side token (kept out of client bundles). Set either
// ONEMAP_TOKEN or ONEMAP_API_KEY in your environment when required by OneMap.
const ONEMAP_TOKEN =
  process.env.ONEMAP_TOKEN || process.env.ONEMAP_API_KEY || "";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);

  const searchVal = searchParams.get("searchVal");
  const returnGeom = searchParams.get("returnGeom") || "Y";
  const getAddrDetails = searchParams.get("getAddrDetails") || "Y";

  if (!searchVal) {
    return NextResponse.json(
      { error: "Search value is required" },
      { status: 400 }
    );
  }

  try {
    const url = `${ONEMAP_BASE_URL}?searchVal=${encodeURIComponent(
      searchVal
    )}&returnGeom=${returnGeom}&getAddrDetails=${getAddrDetails}${
      ONEMAP_TOKEN ? `&token=${encodeURIComponent(ONEMAP_TOKEN)}` : ""
    }`;

    const headers: Record<string, string> = {
      accept: "application/json",
    };

    if (ONEMAP_TOKEN) {
      headers["authorization"] = `Bearer ${ONEMAP_TOKEN}`;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error("Failed to search location");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error searching location:", error);
    return NextResponse.json(
      { error: "Failed to search location" },
      { status: 500 }
    );
  }
}
