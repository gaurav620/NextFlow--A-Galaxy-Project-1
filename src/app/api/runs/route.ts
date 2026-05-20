import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema } from "@/lib/types";
import { executeWorkflow } from "@/lib/execute";
import { runEventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  targetNodeIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { workflowId, scope, targetNodeIds } = parsed.data;

  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const graphParsed = WorkflowGraphSchema.safeParse(wf.graph);
  if (!graphParsed.success)
    return NextResponse.json({ error: "invalid_graph" }, { status: 400 });
  const graph = graphParsed.data;

  // Choose target nodes for the run-time persistence
  const targetIds = new Set(
    scope === "full"
      ? graph.nodes.map((n) => n.id)
      : targetNodeIds ?? []
  );

  const run = await prisma.run.create({
    data: {
      workflowId,
      userId,
      scope,
      status: "running",
      nodeRuns: {
        create: graph.nodes
          .filter((n) => targetIds.has(n.id))
          .map((n) => ({
            nodeId: n.id,
            nodeType: n.type,
            status: "pending",
          })),
      },
    },
  });

  // Instead of fire-and-forget, stream the execution inline as SSE.
  // This keeps the serverless function alive on Vercel during execution.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (evt: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
        } catch {
          // Controller may be closed if client disconnected
        }
      };

      // Initial hello
      send({ type: "hello", runId: run.id });

      try {
        await executeWorkflow({
          runId: run.id,
          workflowId,
          graph: graph as Parameters<typeof executeWorkflow>[0]["graph"],
          scope,
          targetNodeIds,
          onEvent: (evt) => {
            send(evt);
            // Also emit to event bus for the history panel / other subscribers
            runEventBus.emit(run.id, evt);
          },
        });
      } catch (err) {
        console.error("Run execution failed", err);
        send({ type: "run-finish", error: String(err) });
      }

      try { controller.close(); } catch { /* already closed */ }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Run-Id": run.id,
    },
  });
}
