import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("unauthorized", { status: 401 });
  const { id } = await params;
  
  // Verify ownership ONLY if the run record already exists.
  const run = await prisma.run.findFirst({ where: { id } });
  if (run && run.userId !== userId) {
    return new Response("unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const emittedNodeStatuses = new Map<string, string>();
  let emittedRunFinish = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (evt: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
        } catch {
          // Controller may be closed if client disconnected
        }
      };
      
      send({ type: "hello", runId: id });
      console.log(`[runs/stream] Opened SSE stream for runId=${id}`);

      try {
        while (!req.signal.aborted) {
          const freshRun = await prisma.run.findUnique({
            where: { id },
            include: { nodeRuns: true },
          });

          if (!freshRun) {
            await sleep(1000);
            continue;
          }

          if (freshRun.userId !== userId) {
            send({ type: "error", message: "unauthorized" });
            try { controller.close(); } catch {}
            break;
          }

          // Check each node status and emit events on transition
          for (const nr of freshRun.nodeRuns) {
            const prevStatus = emittedNodeStatuses.get(nr.nodeId);
            if (prevStatus !== nr.status) {
              emittedNodeStatuses.set(nr.nodeId, nr.status);
              console.log(`[runs/stream] Node runId=${id} node=${nr.nodeId} state=${prevStatus ?? "none"} -> ${nr.status}`);

              if (nr.status === "pending") {
                send({ type: "node-queued", nodeId: nr.nodeId, nodeType: nr.nodeType });
              } else if (nr.status === "running") {
                send({ type: "node-start", nodeId: nr.nodeId, nodeType: nr.nodeType });
              } else if (nr.status === "success") {
                send({ type: "node-finish", nodeId: nr.nodeId, nodeType: nr.nodeType, output: nr.output });
              } else if (nr.status === "error" || nr.status === "failed") {
                send({ type: "node-error", nodeId: nr.nodeId, nodeType: nr.nodeType, error: nr.error || "Execution failed" });
              }
            }
          }

          const isFinalStatus = 
            freshRun.status !== "running" &&
            freshRun.status !== "pending" &&
            freshRun.status !== "idle" &&
            freshRun.status !== "queued";

          if (isFinalStatus || freshRun.finishedAt) {
            if (!emittedRunFinish) {
              console.log(`[runs/stream] Workflow runId=${id} finished with status=${freshRun.status}`);
              send({ type: "run-finish", status: freshRun.status });
              emittedRunFinish = true;
            }
            try { controller.close(); } catch {}
            break;
          }

          await sleep(1000);
        }
      } catch (err) {
        console.error(`[runs/stream] Error in SSE stream for runId=${id}:`, err);
      } finally {
        console.log(`[runs/stream] Closed SSE stream for runId=${id}`);
      }
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
