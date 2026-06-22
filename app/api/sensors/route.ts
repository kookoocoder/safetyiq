export const runtime = "nodejs";

import { getScenarioController } from "@/app/api/scenario/_lib/scenario-controller";
import { getSensorMockEngine } from "@/app/api/sensors/_lib/sensor-mock-engine";

const TICK_MS = Number(process.env.SENSOR_TICK_INTERVAL_MS ?? 1000);

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const engine = getSensorMockEngine();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send(engine.getLatestReadings());

      const interval = setInterval(() => {
        try {
          const { readings, advanced } = engine.tickIfDue(TICK_MS);
          if (advanced) getScenarioController().onSensorTick();
          send(readings);
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, TICK_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
