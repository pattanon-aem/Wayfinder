import { NextResponse } from "next/server";

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get("skip") || "0";

  try {
    const response = await fetch(`${LTA_BASE_URL}/BusRoutes?$skip=${skip}`, {
      headers: {
        AccountKey: LTA_API_KEY || "",
        accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bus routes");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bus routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch bus routes" },
      { status: 500 }
    );
  }
}
