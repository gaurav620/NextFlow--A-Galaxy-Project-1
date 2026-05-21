import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Workflow as WorkflowIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createWorkflow, createSampleWorkflow } from "@/app/actions/workflows";
import { WorkflowRow } from "@/components/dashboard/WorkflowRow";
import { UserButton } from "@clerk/nextjs";

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
    <div className="flex flex-1 min-h-screen">
      <aside className="w-60 border-r border-neutral-200 bg-white flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-neutral-200">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-amber-400" />
          <span className="font-semibold tracking-tight">NextFlow</span>
        </div>
        <nav className="px-3 py-4 flex-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 text-sm font-medium"
          >
            <WorkflowIcon size={16} /> Workflows
          </Link>
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <UserButton />
        </div>
      </aside>

      <main className="flex-1 px-10 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Build and run LLM workflows visually.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form action={createSampleWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium hover:bg-neutral-50"
              >
                Load Sample
              </button>
            </form>
            <form action={createWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
              >
                <Plus size={16} /> New Workflow
              </button>
            </form>
          </div>
        </div>

        {workflows.length === 0 ? (
          <div className="nf-card p-16 text-center max-w-md mx-auto">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center mb-5 shadow-lg shadow-purple-200">
              <WorkflowIcon size={26} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">No workflows yet</h2>
            <p className="text-sm text-neutral-500 mt-2 mb-8 leading-relaxed">
              Create a blank workflow or load the 7-node sample to explore the canvas.
            </p>
            <div className="flex flex-col items-center gap-3">
              <form action={createSampleWorkflow} className="w-full max-w-xs">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold hover:from-purple-700 hover:to-purple-600 shadow-sm hover:shadow-md transition-all"
                >
                  <WorkflowIcon size={15} /> Load Sample Workflow
                </button>
              </form>
              <form action={createWorkflow} className="w-full max-w-xs">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm font-medium hover:bg-neutral-50 text-neutral-700 transition-all"
                >
                  <Plus size={15} /> New Blank Workflow
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
