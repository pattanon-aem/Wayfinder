import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/apiAuth";

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

// Simple SSE stream that polls the upstream LTA taxi availability and forwards
// the most recent payload to connected clients. This keeps the client from
// having to poll repeatedly. The stream is intended for dev / self-hosting.
export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  // Create a ReadableStream that periodically fetches LTA taxi availability
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      let lastPayload: string | null = null;
      let closed = false;

      // Helper to send an event to the client
      const send = (obj: any) => {
        try {
          const payload = JSON.stringify(obj);
          // only send if changed to reduce traffic
          if (payload === lastPayload) return;
          lastPayload = payload;
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (e) {
          // swallow encode errors
          console.error("Failed to enqueue taxi payload", e);
        }
      };

      // Single fetch + periodic poll. Interval set to 60s to reduce load.
      const fetchAndSend = async () => {
        try {
          const res = await fetch(`${LTA_BASE_URL}/Taxi-Availability`, {
            headers: {
              AccountKey: LTA_API_KEY || "",
              accept: "application/json",
            },
            cache: "no-store",
          });

          if (!res.ok) {
            send({
              error: "Failed to fetch taxi availability",
              status: res.status,
            });
            return;
          }

          const data = await res.json();
          send(data);
        } catch (err) {
          console.error("Taxi SSE fetch error:", err);
          send({ error: "Taxi availability fetch error" });
        }
      };

      // Do one immediate fetch
      await fetchAndSend();

      const interval = setInterval(() => {
        if (closed) return;
        fetchAndSend();
      }, 60000);

      // If the client disconnects, the request.signal will be aborted.
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // ignore
        }
      });
    },
    cancel() {
      // Nothing special to do — interval will be cleared by abort handler
    },
  });

  return new Response(stream, { headers });
}
