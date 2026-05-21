import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { runEventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("unauthorized", { status: 401 });
  const { id } = await params;
  
  // Verify ownership ONLY if the run record already exists.
  // If the run doesn't exist yet (due to race condition where stream connects
  // before POST creates the DB row), we still allow the SSE stream.
  const run = await prisma.run.findFirst({ where: { id } });
  if (run && run.userId !== userId) {
    return new Response("unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (evt: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
        } catch {
          // Controller may be closed if client disconnected
        }
      };
      send({ type: "hello", runId: id });

      // Subscribe to live events AND get any buffered events we missed
      const { unsubscribe, buffered } = runEventBus.subscribe(id, (evt) => {
        send(evt);
        if (evt.type === "run-finish") {
          unsubscribe();
          try { controller.close(); } catch { /* already closed */ }
        }
      });

      // Replay any buffered events that were emitted before we subscribed
      let alreadyFinished = false;
      for (const evt of buffered) {
        send(evt);
        if (evt.type === "run-finish") {
          alreadyFinished = true;
        }
      }

      if (alreadyFinished) {
        unsubscribe();
        try { controller.close(); } catch { /* already closed */ }
        return;
      }

      // Also re-check the DB in case the run finished between our initial
      // fetch and the subscribe call, and all events were already cleaned up
      void prisma.run.findFirst({ where: { id } }).then((freshRun) => {
        if (freshRun?.finishedAt && !alreadyFinished) {
          unsubscribe();
          send({ type: "run-finish" });
          try { controller.close(); } catch { /* already closed */ }
        }
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
