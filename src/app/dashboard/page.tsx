import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createWorkflow, createSampleWorkflow } from "@/app/actions/workflows";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      graph: true,
      _count: { select: { runs: true } },
      runs: {
        where: { status: "running" },
        select: { id: true },
        take: 1,
      },
    },
  });

  const serialized = workflows.map((w) => ({
    id: w.id,
    name: w.name,
    updatedAt: w.updatedAt.toISOString(),
    graph: w.graph as { nodes?: { type: string }[] },
  }));

  return (
    <DashboardShell
      workflows={serialized}
      createWorkflowAction={createWorkflow}
      createSampleWorkflowAction={createSampleWorkflow}
    />
  );
}
