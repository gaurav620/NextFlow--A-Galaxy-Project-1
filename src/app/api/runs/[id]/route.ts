import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      nodeRuns: {
        orderBy: { startedAt: "asc" },
      },
    },
  });

  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  // Verify the run belongs to a workflow the user owns
  const workflow = await prisma.workflow.findUnique({
    where: { id: run.workflowId },
    select: { userId: true },
  });

  if (!workflow || workflow.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({
    run: {
      id: run.id,
      workflowId: run.workflowId,
      scope: run.scope,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      nodeRuns: run.nodeRuns.map((nr) => ({
        id: nr.id,
        nodeId: nr.nodeId,
        nodeType: nr.nodeType,
        status: nr.status,
        input: nr.input,
        output: nr.output,
        error: nr.error,
        durationMs: nr.durationMs,
        startedAt: nr.startedAt,
        finishedAt: nr.finishedAt,
      })),
    },
  });
}
