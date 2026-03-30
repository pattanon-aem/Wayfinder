import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = (await params) as { id: string };
  const target = `https://sc2006-ai.onrender.com/carparks/${encodeURIComponent(
    id
  )}/prediction`;

  try {
    const res = await fetch(target, { cache: "no-store" });

    try {
      const headersToLog: Record<string, string | null> = {
        "content-type": res.headers.get("content-type"),
        "x-powered-by": res.headers.get("x-powered-by"),
      };
      console.debug("[forecast-proxy] upstream response", {
        url: target,
        status: res.status,
        headers: headersToLog,
      });
    } catch (hErr) {
      console.debug("[forecast-proxy] failed to read upstream headers", hErr);
    }

    const text = await res.text();

    console.debug(
      "[forecast-proxy] upstream body (truncated)",
      text && text.length
        ? text.slice
          ? text.slice(0, 4000)
          : String(text)
        : "<empty>"
    );

    // try parse JSON, but return text if not JSON
    try {
      const data = JSON.parse(text);
      console.debug(
        "[forecast-proxy] upstream parsed JSON",
        Array.isArray(data)
          ? `array(${data.length})`
          : Object.keys(data || {}).slice(0, 10)
      );
      return NextResponse.json(data, { status: res.status });
    } catch (e) {
      console.debug(
        '[forecast-proxy] upstream response not JSON, returning raw under "raw" key'
      );
      return NextResponse.json({ raw: text }, { status: res.status });
    }
  } catch (err) {
    console.error("Forecast proxy error", err);
    return NextResponse.json(
      { error: "Failed to fetch forecast" },
      { status: 500 }
    );
  }
}
