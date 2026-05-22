import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Workflow as WorkflowIcon, Layers } from "lucide-react";
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
    <div className="flex min-h-screen bg-white">
      {/* ── Left Sidebar ── */}
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-2.5 border-b border-neutral-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 shadow-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="font-bold text-neutral-900 tracking-tight text-sm">NextFlow</span>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 flex-1 space-y-0.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-900"
          >
            <Layers size={14} className="text-purple-600" />
            Workflows
          </Link>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <UserButton />
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 px-8 py-8 max-w-[1200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Workflows</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Build and run LLM workflows visually.</p>
          </div>
          <div className="flex items-center gap-2">
            <form action={createSampleWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
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
          <div className="border border-neutral-200 rounded-xl p-16 text-center max-w-md mx-auto bg-white">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center mb-5">
              <WorkflowIcon size={26} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">No workflows yet</h2>
            <p className="text-sm text-neutral-500 mt-2 mb-8 leading-relaxed">
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
