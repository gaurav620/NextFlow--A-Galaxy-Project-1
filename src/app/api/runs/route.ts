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

  // Start execution - uses waitUntil if available (Vercel), otherwise fire-and-forget.
  // The event bus buffers all events so the SSE stream can replay them.
  const execPromise = executeWorkflow({
    runId: run.id,
    workflowId,
    graph: graph as Parameters<typeof executeWorkflow>[0]["graph"],
    scope,
    targetNodeIds,
    onEvent: (evt) => runEventBus.emit(run.id, evt),
  }).catch((err) => {
    console.error("Run execution failed", err);
  });

  // Fire-and-forget: the Node.js process stays alive (local dev) and
  // on Vercel the function persists until the response is fully sent.
  // The event bus buffers events for the SSE stream to replay.
  void execPromise;

  return NextResponse.json({ runId: run.id });
}
