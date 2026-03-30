import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const response = await fetch(`${LTA_BASE_URL}/ERPRates`, {
      headers: {
        AccountKey: LTA_API_KEY || "",
        accept: "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch ERP rates");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching ERP rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch ERP rates" },
      { status: 500 }
    );
  }
}
