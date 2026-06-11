"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2 } from "lucide-react";
import { deleteWorkflow } from "@/app/actions/workflows";
import { formatDistanceToNow } from "@/lib/format-date";
import { cn } from "@/lib/cn";

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
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = tasks.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} task(s)?`)) return;
    startTransition(async () => {
      for (const id of selected) {
        await deleteWorkflow(id);
      }
      setSelected(new Set());
      setSelectMode(false);
      router.refresh();
    });
  };

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
          <div className="flex items-center gap-2">
            {selectMode && selected.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isPending}
                className="text-[13px] font-medium text-red-500 hover:underline disabled:opacity-50"
              >
                Delete ({selected.size})
              </button>
            )}
            <button
              onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
              className={cn(
                "text-[13px] font-medium hover:underline",
                selectMode ? "text-neutral-900 dark:text-zinc-100" : "text-blue-600 dark:text-blue-400"
              )}
            >
              {selectMode ? "Done" : "Select"}
            </button>
          </div>
        </div>

        {/* Tasks */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[14px] text-neutral-400 dark:text-zinc-500">No tasks yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selected.has(task.id)}
                    onChange={() => toggleSelect(task.id)}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-zinc-600 accent-purple-500"
                  />
                )}
                <Link
                  href={`/workflow/${task.id}`}
                  className="flex items-center justify-between flex-1 min-w-0"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-neutral-900 dark:text-zinc-100 truncate">{task.name}</p>
                    <p className="text-[12px] text-neutral-400 dark:text-zinc-500">
                      {formatDistanceToNow(task.updatedAt)}
                    </p>
                  </div>
                  <span className="text-neutral-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
