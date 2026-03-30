import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<
  { userId: string } | NextResponse
> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized - please sign in" },
      { status: 401 }
    );
  }

  return { userId };
}
