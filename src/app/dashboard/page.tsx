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
    <div className="flex min-h-screen bg-[#08080a]">
      {/* ── Dark Left Sidebar ── */}
      <aside className="w-56 shrink-0 border-r border-white/5 bg-zinc-950/80 backdrop-blur-md flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-2.5 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-amber-400 shadow-lg shadow-purple-500/20" />
          <span className="font-bold text-zinc-100 tracking-tight text-sm">NextFlow</span>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/8 text-xs font-semibold text-zinc-100 border border-white/8 shadow-sm"
          >
            <Layers size={14} className="text-purple-400" />
            Workflows
          </Link>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <UserButton />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 px-8 py-8 max-w-[1200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Workflows</h1>
            <p className="text-sm text-zinc-500 mt-1">Build and run LLM workflows visually.</p>
          </div>
          <div className="flex items-center gap-2">
            <form action={createSampleWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-zinc-100 transition-all duration-150"
              >
                <WorkflowIcon size={14} />
                Load Sample
              </button>
            </form>
            <form action={createWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-150 active:scale-95"
              >
                <Plus size={15} />
                New Workflow
              </button>
            </form>
          </div>
        </div>

        {/* Content */}
        {workflows.length === 0 ? (
          <div className="nf-card p-16 text-center max-w-md mx-auto">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20">
              <WorkflowIcon size={26} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">No workflows yet</h2>
            <p className="text-sm text-zinc-500 mt-2 mb-8 leading-relaxed">
              Create a blank workflow or load the 7-node sample to explore the canvas.
            </p>
            <div className="flex flex-col items-center gap-3">
              <form action={createSampleWorkflow} className="w-full max-w-xs">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all active:scale-95"
                >
                  <WorkflowIcon size={15} />
                  Load Sample Workflow
                </button>
              </form>
              <form action={createWorkflow} className="w-full max-w-xs">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-zinc-100 transition-all active:scale-95"
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
