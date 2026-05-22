import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const run = await prisma.run.findFirst({
    where: { id },
    include: { workflow: { select: { userId: true } } },
  });
  if (!run || run.workflow.userId !== userId)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Mark run and all pending/running node runs as cancelled
  await prisma.$transaction([
    prisma.run.update({
      where: { id },
      data: { status: "cancelled", finishedAt: new Date() },
    }),
    prisma.nodeRun.updateMany({
      where: { runId: id, status: { in: ["pending", "running"] } },
      data: { status: "cancelled", finishedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
