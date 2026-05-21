import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema } from "@/lib/types";
import { executeWorkflow } from "@/lib/execute";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Up to 5 min on Vercel Pro

const Body = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  targetNodeIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "invalid", details: parsed.error.issues }, { status: 400 });
    const { workflowId, scope, targetNodeIds } = parsed.data;

    const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
    if (!wf)
      return NextResponse.json({ error: "not_found" }, { status: 404 });

    const graphParsed = WorkflowGraphSchema.safeParse(wf.graph);
    if (!graphParsed.success)
      return NextResponse.json({ error: "invalid_graph" }, { status: 400 });
    const graph = graphParsed.data;

    const targetIds = new Set(
      scope === "full"
        ? graph.nodes.map((n) => n.id)
        : targetNodeIds ?? []
    );

    // Create run record in DB
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

    // Return runId immediately so the client can start polling
    // Then execute the workflow — on Vercel this runs within the same serverless invocation.
    // With maxDuration=300 the function stays alive up to 5 minutes.
    // The execution writes results directly to DB (nodeRuns), which the client polls.
    executeWorkflow({
      runId: run.id,
      workflowId,
      graph: graph as Parameters<typeof executeWorkflow>[0]["graph"],
      scope,
      targetNodeIds,
      onEvent: () => {}, // results are persisted in DB by executeWorkflow
    }).catch((err) => {
      console.error("[runs/route] execution error:", err);
    });

    // Note: on Vercel, returning here does NOT kill execution —
    // the function stays alive until all async work settles (up to maxDuration).
    return NextResponse.json({ runId: run.id });
  } catch (err) {
    console.error("[runs/route] unexpected error:", err);
    return NextResponse.json(
      { error: "internal", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
