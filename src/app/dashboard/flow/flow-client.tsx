"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Upload, GitBranch, Workflow } from "lucide-react";
import { createWorkflow, createSampleWorkflow } from "@/app/actions/workflows";
import { formatDistanceToNow } from "@/lib/format-date";

interface WorkflowData {
  id: string;
  name: string;
  updatedAt: string;
}

interface Props {
  workflows: WorkflowData[];
}

export function FlowPageClient({ workflows }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[960px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">Flow</h1>
            <p className="text-[13px] text-neutral-400 dark:text-zinc-500">Build workflows or run models directly.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-white/10 text-[13px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
              <Upload size={14} /> Import
            </button>
            <form action={createWorkflow}>
              <button
                type="submit"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* System Workflows */}
        <div className="mt-8 mb-8">
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-zinc-100 mb-1">System Workflows</h2>
          <p className="text-[13px] text-neutral-400 dark:text-zinc-500 mb-4">Pre-built workflow templates — click to open and start using.</p>

          <form action={createSampleWorkflow}>
            <button
              type="submit"
              className="rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 overflow-hidden hover:shadow-lg hover:border-neutral-300 dark:hover:border-white/15 transition-all duration-200 cursor-pointer group w-[200px]"
            >
              {/* Template image area */}
              <div className="h-[130px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Workflow size={36} className="text-purple-500/50 group-hover:text-purple-500/70 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="px-4 py-3 text-left">
                <p className="text-[13px] font-bold text-neutral-900 dark:text-zinc-100">AI Workflow Generator</p>
              </div>
            </button>
          </form>
        </div>

        {/* Your Workflows */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-[15px] font-bold text-neutral-900 dark:text-zinc-100">Your Workflows</h2>
              <p className="text-[13px] text-neutral-400 dark:text-zinc-500">Open one to edit, run, and review history.</p>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-[180px] rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900/50 text-[12px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <GitBranch size={24} className="text-neutral-300 dark:text-zinc-600" />
              </div>
              <p className="text-[14px] text-neutral-400 dark:text-zinc-500 mb-4">No workflows yet</p>
              <form action={createWorkflow}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <Plus size={14} /> Create Workflow
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {filtered.map((w) => (
                <Link
                  key={w.id}
                  href={`/workflow/${w.id}`}
                  className="rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 overflow-hidden hover:shadow-lg hover:border-neutral-300 dark:hover:border-white/15 transition-all duration-200 group"
                >
                  {/* Workflow card image */}
                  <div className="h-[100px] bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                    <Workflow size={28} className="text-neutral-300 dark:text-zinc-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[12px] font-semibold text-neutral-900 dark:text-zinc-100 truncate">{w.name}</p>
                    <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Edited {formatDistanceToNow(w.updatedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
