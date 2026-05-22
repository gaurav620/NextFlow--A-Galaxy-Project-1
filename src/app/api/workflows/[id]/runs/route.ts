import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Runs stuck in "running" longer than this are considered dead (Vercel lambda killed)
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  // Auto-expire stale runs for this workflow (runs stuck in "running" > 10 min)
  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);
  try {
    const staleRuns = await prisma.run.findMany({
      where: {
        workflowId: id,
        userId,
        status: { in: ["running", "pending"] },
        startedAt: { lt: staleThreshold },
      },
      select: { id: true },
    });
    if (staleRuns.length > 0) {
      const staleIds = staleRuns.map((r) => r.id);
      await prisma.$transaction([
        prisma.run.updateMany({
          where: { id: { in: staleIds } },
          data: { status: "error", finishedAt: new Date() },
        }),
        prisma.nodeRun.updateMany({
          where: { runId: { in: staleIds }, status: { in: ["running", "pending"] } },
          data: { status: "error", finishedAt: new Date() },
        }),
      ]);
    }
  } catch {
    // Non-critical — don't fail the request if cleanup fails
  }

  const runs = await prisma.run.findMany({
    where: { workflowId: id, userId },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { nodeRuns: true },
  });
  return NextResponse.json({ runs });
}
