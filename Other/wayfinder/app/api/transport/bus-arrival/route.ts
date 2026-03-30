import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const busStopCode = searchParams.get("busStopCode");
  const serviceNo = searchParams.get("serviceNo");

  if (!busStopCode) {
    return NextResponse.json(
      { error: "Bus stop code is required" },
      { status: 400 }
    );
  }

  try {
    let url = `${LTA_BASE_URL}/v3/BusArrival?BusStopCode=${busStopCode}`;
    if (serviceNo) {
      url += `&ServiceNo=${serviceNo}`;
    }

    const response = await fetch(url, {
      headers: {
        AccountKey: LTA_API_KEY || "",
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bus arrival data");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bus arrivals:", error);
    return NextResponse.json(
      { error: "Failed to fetch bus arrival data" },
      { status: 500 }
    );
  }
}
