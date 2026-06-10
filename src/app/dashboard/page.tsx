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
    href: "#",
    color: "text-blue-500",
  },
  {
    icon: GitBranch,
    title: "Flow",
    desc: "Build AI workflows visually — chain models, no code required.",
    href: "#",
    color: "text-purple-500",
  },
  {
    icon: Cpu,
    title: "Nodes",
    desc: "Run any model directly — text, image, video, audio.",
    href: "#",
    color: "text-amber-500",
  },
  {
    icon: LayoutGrid,
    title: "Library",
    desc: "Browse your generated images, videos, audio, and files.",
    href: "#",
    color: "text-emerald-500",
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
    <div className="flex min-h-screen bg-neutral-50 dark:bg-zinc-950">
      {/* ── Left Sidebar ── */}
      <DashboardSidebar />

      {/* ── Main Content ── */}
      <main className="flex-1 px-8 py-8 max-w-[900px] mx-auto">
        {/* Welcome hero — Magica style */}
        <div className="border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-2xl p-8 mb-8 bg-white dark:bg-zinc-900/30">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/5 text-[11px] font-semibold text-neutral-600 dark:text-zinc-400 mb-4">
            <Sparkles size={12} className="text-purple-500" />
            All-in-One AI Platform
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-zinc-100 tracking-tight mb-2">
            Welcome to NextFlow
          </h1>
          <p className="text-sm text-neutral-500 dark:text-zinc-400 max-w-lg leading-relaxed">
            Pick where you want to start — chat with an AI agent, build workflows,
            run models, or browse your library.
          </p>
        </div>

        {/* Feature cards — 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group rounded-xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 p-6 hover:shadow-lg dark:hover:border-white/10 transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Icon size={20} className={color} />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-zinc-100 mb-1">{title}</h3>
              <p className="text-sm text-neutral-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* API · MCP card */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 p-6 flex items-center gap-4 mb-10 hover:shadow-lg dark:hover:border-white/10 transition-all duration-200 cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center shrink-0">
            <Code2 size={20} className="text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-neutral-900 dark:text-zinc-100">API · MCP</h3>
            <p className="text-sm text-neutral-500 dark:text-zinc-400">
              Use NextFlow from your code or an MCP-aware agent. Opens docs.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-zinc-500 shrink-0">
            <ExternalLink size={12} />
            <span>External</span>
          </div>
        </div>

        {/* Workflows section */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-zinc-100 tracking-tight">Your Workflows</h2>
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus size={15} />
                New Workflow
              </button>
            </form>
          </div>
        </div>

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
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
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
