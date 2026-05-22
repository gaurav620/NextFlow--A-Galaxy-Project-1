import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Plus, Workflow as WorkflowIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createWorkflow, createSampleWorkflow } from "@/app/actions/workflows";
import { WorkflowRow } from "@/components/dashboard/WorkflowRow";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

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
      _count: { select: { runs: true } },
      runs: {
        where: { status: "running" },
        select: { id: true },
        take: 1,
      },
    },
  });

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* ── Left Sidebar ── */}
      <DashboardSidebar />

      {/* ── Main Content ── */}
      <main className="flex-1 px-8 py-8 max-w-[1200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-zinc-100 tracking-tight">Workflows</h1>
            <p className="text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">Build and run LLM workflows visually.</p>
          </div>
          <div className="flex items-center gap-2">
            <form action={createSampleWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
              >
                <WorkflowIcon size={14} />
                Load Sample
              </button>
            </form>
            <form action={createWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
              >
                <Plus size={15} />
                New Workflow
              </button>
            </form>
          </div>
        </div>

        {/* Content */}
        {workflows.length === 0 ? (
          <div className="border border-neutral-200 dark:border-white/10 rounded-xl p-16 text-center max-w-md mx-auto bg-white dark:bg-zinc-900/50">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center mb-5">
              <WorkflowIcon size={26} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100">No workflows yet</h2>
            <p className="text-sm text-neutral-500 dark:text-zinc-400 mt-2 mb-8 leading-relaxed">
              Create a blank workflow or load the sample to explore the canvas.
            </p>
            <div className="flex flex-col items-center gap-3">
              <form action={createSampleWorkflow} className="w-full max-w-xs">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  <WorkflowIcon size={15} />
                  Load Sample Workflow
                </button>
              </form>
              <form action={createWorkflow} className="w-full max-w-xs">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Plus size={15} />
                  New Blank Workflow
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((w) => (
              <WorkflowRow
                key={w.id}
                id={w.id}
                name={w.name}
                updatedAt={w.updatedAt.toISOString()}
                runCount={w._count.runs}
                hasActiveRun={w.runs.length > 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
