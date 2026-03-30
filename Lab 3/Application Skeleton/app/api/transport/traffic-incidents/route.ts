import { NextResponse } from "next/server";

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

export async function GET() {
  try {
    const response = await fetch(`${LTA_BASE_URL}/TrafficIncidents`, {
      headers: {
        AccountKey: LTA_API_KEY || "",
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch traffic incidents");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching traffic incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic incidents" },
      { status: 500 }
    );
  }
}
