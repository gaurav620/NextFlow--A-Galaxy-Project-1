import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  targetNodeIds: z.array(z.string()).optional(),
  runId: z.string().optional(),
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
    const { workflowId, scope, targetNodeIds, runId } = parsed.data;

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

    // Create run + nodeRuns in DB
    const run = await prisma.run.create({
      data: {
        id: runId, // Use client-provided runId if present!
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

    // Trigger the workflow orchestrator task asynchronously on Trigger.dev
    try {
      const { workflowOrchestratorTask } = await import("@/trigger/workflow-orchestrator");
      const handle = await workflowOrchestratorTask.trigger({
        runId: run.id,
        workflowId,
        graph: graph as any,
        scope,
        targetNodeIds,
      });
      console.log(`[runs/route] Triggered workflow-orchestrator task runId=${run.id} handleId=${handle.id}`);
    } catch (triggerErr) {
      console.error(`[runs/route] Failed to trigger workflow-orchestrator task for runId=${run.id}:`, triggerErr);
      // Update database status of the Run so it doesn't hang in "running" if trigger fails
      await prisma.run.update({
        where: { id: run.id },
        data: { status: "error", finishedAt: new Date() },
      }).catch((dbErr) => console.error("[runs/route] Failed to update Run status on trigger failure:", dbErr));
      return NextResponse.json({ error: "failed_to_trigger", message: String(triggerErr) }, { status: 500 });
    }

    return NextResponse.json({ runId: run.id });
  } catch (err) {
    console.error("[runs/route] unexpected error:", err);
    return NextResponse.json(
      { error: "internal", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
