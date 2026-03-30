import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();

    const upstream = await fetch("https://sc2006-ai.onrender.com/explain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    const contentType =
      upstream.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (err) {
    console.error("AI proxy error:", err);
    return NextResponse.json({ error: "AI proxy failed" }, { status: 502 });
  }
}
