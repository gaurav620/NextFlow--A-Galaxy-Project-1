"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { formatDistanceToNow } from "@/lib/format-date";

interface Task {
  id: string;
  name: string;
  updatedAt: string;
}

interface Props {
  tasks: Task[];
}

export function TasksPageClient({ tasks }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = tasks.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[780px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">Tasks</h1>
          <Link
            href="/dashboard"
            className="p-1.5 rounded-md text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            title="New task"
          >
            <Plus size={18} />
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search your tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900/50 text-[13px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 dark:focus:border-purple-500/30 transition-all"
          />
        </div>

        {/* Tasks list header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-[13px] text-neutral-500 dark:text-zinc-400">Your tasks with NextFlow</p>
          <button className="text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Select
          </button>
        </div>

        {/* Tasks */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[14px] text-neutral-400 dark:text-zinc-500">No tasks yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((task) => (
              <Link
                key={task.id}
                href={`/workflow/${task.id}`}
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-neutral-900 dark:text-zinc-100 truncate">{task.name}</p>
                  <p className="text-[12px] text-neutral-400 dark:text-zinc-500">
                    {formatDistanceToNow(task.updatedAt)}
                  </p>
                </div>
                <span className="text-neutral-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
