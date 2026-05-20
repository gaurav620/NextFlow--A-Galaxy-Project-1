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
          <div className="nf-card p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-amber-400/10 flex items-center justify-center mb-4">
              <WorkflowIcon size={22} className="text-purple-500" />
            </div>
            <h2 className="font-semibold">No workflows yet</h2>
            <p className="text-sm text-neutral-500 mt-1 mb-6">
              Create your first workflow to get started.
            </p>
            <form action={createWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium"
              >
                <Plus size={16} /> New Workflow
              </button>
            </form>
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
