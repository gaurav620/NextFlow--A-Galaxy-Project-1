"use client";

import { useState } from "react";
import { Search, Plus, ChevronDown } from "lucide-react";

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Activity");

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[780px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">Projects</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-zinc-400">
              <span>Sort by</span>
              <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-zinc-300 font-medium hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                {sortBy}
                <ChevronDown size={12} />
              </button>
            </div>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors">
              New project
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900/50 text-[13px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 dark:focus:border-purple-500/30 transition-all"
          />
        </div>

        {/* Empty state */}
        <div className="py-24 text-center">
          <p className="text-[14px] text-neutral-400 dark:text-zinc-500 mb-3">No projects yet</p>
          <button className="text-[14px] font-semibold text-neutral-900 dark:text-zinc-100 underline underline-offset-2 hover:no-underline">
            New project
          </button>
        </div>
      </div>
    </main>
  );
}
