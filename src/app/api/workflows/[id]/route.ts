import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema } from "@/lib/types";

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  graph: WorkflowGraphSchema.optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const wf = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!wf) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(wf);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  const wf = await prisma.workflow.update({
    where: { id, userId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.graph
        ? { graph: parsed.data.graph as unknown as object }
        : {}),
    },
  });
  return NextResponse.json(wf);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.workflow.delete({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
