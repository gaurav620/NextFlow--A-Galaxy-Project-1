import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const runs = await prisma.run.findMany({
    where: { workflowId: id, userId },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { nodeRuns: true },
  });
  return NextResponse.json({ runs });
}
