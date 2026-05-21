import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema } from "@/lib/types";
import { executeWorkflow } from "@/lib/execute";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min on Vercel Pro; 10s on Hobby

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

    // Create run + nodeRuns in DB
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

    // IMPORTANT: We await execution BEFORE returning the response.
    // This keeps the Vercel serverless function alive for the full maxDuration.
    // The client will receive {runId} only AFTER execution is complete,
    // but that's fine — the poll loop will see all nodes already done
    // and update the UI in one pass.
    //
    // Alternative: use Vercel Background Functions or Trigger.dev for
    // workflows that exceed the function timeout.
    try {
      await executeWorkflow({
        runId: run.id,
        workflowId,
        graph: graph as Parameters<typeof executeWorkflow>[0]["graph"],
        scope,
        targetNodeIds,
        onEvent: () => {},
      });
    } catch (execErr) {
      console.error("[runs/route] execution error:", execErr);
      // Even if execution errors, return the runId so client can see partial results
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
