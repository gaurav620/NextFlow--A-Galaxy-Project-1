import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Canvas } from "@/components/canvas/Canvas";
import { WorkflowGraphSchema, defaultWorkflowGraph } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { id } = await params;
  const wf = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!wf) notFound();

  const parsed = WorkflowGraphSchema.safeParse(wf.graph);
  const graph = (parsed.success ? parsed.data : defaultWorkflowGraph()) as ReturnType<typeof defaultWorkflowGraph>;

  return <Canvas workflowId={wf.id} name={wf.name} graph={graph} />;
}
