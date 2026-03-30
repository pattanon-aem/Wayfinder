import { NextResponse } from "next/server";

const ONEMAP_BASE_URL = "https://www.onemap.gov.sg/api/common/elastic/search";

export async function GET(request: Request) {
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
    const response = await fetch(
      `${ONEMAP_BASE_URL}?searchVal=${encodeURIComponent(
        searchVal
      )}&returnGeom=${returnGeom}&getAddrDetails=${getAddrDetails}`,
      {
        headers: {
          accept: "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

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
