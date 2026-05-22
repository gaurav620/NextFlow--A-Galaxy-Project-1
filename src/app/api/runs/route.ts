import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema } from "@/lib/types";
import { executeWorkflow } from "@/lib/execute";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for long workflows (Vercel Pro)

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
        id: runId,
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

    // Always try Trigger.dev first (works in both prod and local dev with trigger:dev).
    // Falls back to in-process ONLY when Trigger.dev SDK throws (local dev without trigger:dev running).
    let usedTrigger = false;
    try {
      const { workflowOrchestratorTask } = await import("@/trigger/workflow-orchestrator");
      const handle = await workflowOrchestratorTask.trigger({
        runId: run.id,
        workflowId,
        graph: graph as never,
        scope,
        targetNodeIds,
      });
      console.log(`[runs/route] Triggered workflow-orchestrator task runId=${run.id} handleId=${handle.id}`);
      usedTrigger = true;
    } catch (triggerErr) {
      console.warn(`[runs/route] Trigger.dev unavailable, falling back to in-process:`, String(triggerErr).slice(0, 200));
    }

    if (!usedTrigger) {
      // In-process fallback for local dev without trigger:dev running
      void executeWorkflow({
        runId: run.id,
        workflowId,
        graph: graph as never,
        scope,
        targetNodeIds,
        onEvent: (evt) => {
          console.log(`[runs/route] In-process event: [${evt.type}] nodeId=${evt.nodeId ?? "N/A"}`);
        },
      }).catch((err) => {
        console.error(`[runs/route] In-process execution failed for runId=${run.id}:`, err);
      });
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
