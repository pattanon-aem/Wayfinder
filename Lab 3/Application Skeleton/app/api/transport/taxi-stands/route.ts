import { NextResponse } from "next/server";

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

export async function GET() {
  try {
    const response = await fetch(`${LTA_BASE_URL}/TaxiStands`, {
      headers: {
        AccountKey: LTA_API_KEY || "",
        accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error("Failed to fetch taxi stands");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching taxi stands:", error);
    return NextResponse.json(
      { error: "Failed to fetch taxi stands" },
      { status: 500 }
    );
  }
}
