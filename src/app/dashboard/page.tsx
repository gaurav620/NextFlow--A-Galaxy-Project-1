import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Plus,
  Workflow as WorkflowIcon,
  MessageSquare,
  GitBranch,
  Cpu,
  LayoutGrid,
  Code2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createWorkflow, createSampleWorkflow } from "@/app/actions/workflows";
import { WorkflowRow } from "@/components/dashboard/WorkflowRow";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Chat",
    desc: "Talk to an AI super-agent that runs workflows, generates content, and gets things done.",
  },
  {
    icon: GitBranch,
    title: "Flow",
    desc: "Build AI workflows visually — chain models, no code required.",
  },
  {
    icon: Cpu,
    title: "Nodes",
    desc: "Run any model directly — text, image, video, audio.",
  },
  {
    icon: LayoutGrid,
    title: "Library",
    desc: "Browse your generated images, videos, audio, and files.",
  },
];

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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[780px] mx-auto px-10 py-10">

          {/* Welcome hero — exact Magica style: green-tinted dashed border */}
          <div className="border border-dashed border-neutral-300/80 dark:border-white/10 rounded-2xl px-8 pt-7 pb-8 mb-8">
            {/* Badge pill — dark bg, white text */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 dark:bg-white/10 text-[11px] font-medium text-white dark:text-zinc-300 mb-5">
              <Sparkles size={11} />
              All-in-One AI Platform
            </div>
            <h1 className="text-[32px] font-extrabold text-neutral-900 dark:text-zinc-100 tracking-tight leading-tight mb-3">
              Welcome to NextFlow
            </h1>
            <p className="text-[14px] text-neutral-500 dark:text-zinc-400 leading-relaxed max-w-[440px]">
              Pick where you want to start — chat with an AI agent, build workflows,
              run models, or browse your library.
            </p>
          </div>

          {/* Feature cards — 2x2 grid, exact Magica style */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-neutral-700 dark:text-zinc-300" />
                </div>
                <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-zinc-100 mb-1">{title}</h3>
                <p className="text-[13px] text-neutral-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* API · MCP card — full width, exact Magica style */}
          <div className="rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 px-5 py-4 flex items-center gap-4 mb-12 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center shrink-0">
              <Code2 size={18} className="text-neutral-700 dark:text-zinc-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-zinc-100">API · MCP</h3>
              <p className="text-[13px] text-neutral-500 dark:text-zinc-400">
                Use NextFlow from your code or an MCP-aware agent. Opens docs.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-neutral-400 dark:text-zinc-500 shrink-0">
              <ExternalLink size={11} />
              External
            </div>
          </div>

          {/* Workflows section */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 tracking-tight">Your Workflows</h2>
              <p className="text-[13px] text-neutral-500 dark:text-zinc-400 mt-0.5">Build and run AI workflows visually.</p>
            </div>
            <div className="flex items-center gap-2">
              <form action={createSampleWorkflow}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-[13px] font-medium text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                >
                  <WorkflowIcon size={14} />
                  Load Sample
                </button>
              </form>
              <form action={createWorkflow}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <Plus size={14} />
                  New Workflow
                </button>
              </form>
            </div>
          </div>

          {workflows.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-5">
                <WorkflowIcon size={24} className="text-neutral-400 dark:text-zinc-500" />
              </div>
              <p className="text-[13px] text-neutral-400 dark:text-zinc-500 mb-4">No workflows yet</p>
              <div className="flex justify-center gap-3">
                <form action={createSampleWorkflow}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors"
                  >
                    Load Sample
                  </button>
                </form>
                <form action={createWorkflow}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-white/10 text-[13px] font-medium text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                  >
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
        </div>
      </main>
    </div>
  );
}
