import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const skip = searchParams.get("skip") || "0";

  try {
    const response = await fetch(`${LTA_BASE_URL}/BusStops?$skip=${skip}`, {
      headers: {
        AccountKey: LTA_API_KEY || "",
        accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bus stops");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bus stops:", error);
    return NextResponse.json(
      { error: "Failed to fetch bus stops" },
      { status: 500 }
    );
  }
}
