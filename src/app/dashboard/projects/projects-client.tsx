"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronDown, FolderOpen, Trash2, Pencil } from "lucide-react";
import { createProject, deleteProject, renameProject } from "@/app/actions/projects";
import { formatDistanceToNow } from "@/lib/format-date";
import { cn } from "@/lib/cn";

interface ProjectData {
  id: string;
  name: string;
  workflowCount: number;
  updatedAt: string;
}

interface Props {
  projects: ProjectData[];
}

export function ProjectsClient({ projects }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Activity");
  const [sortOpen, setSortOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "Name") return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleCreate = () => {
    startTransition(async () => {
      await createProject();
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this project?")) return;
    startTransition(async () => {
      await deleteProject(id);
      router.refresh();
    });
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    startTransition(async () => {
      await renameProject(id, editName.trim());
      setEditingId(null);
      router.refresh();
    });
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[780px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">Projects</h1>
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-zinc-400">
              <span>Sort by</span>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-zinc-300 font-medium hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
              >
                {sortBy}
                <ChevronDown size={12} className={cn("transition-transform", sortOpen && "rotate-180")} />
              </button>
              {sortOpen && (
                <div className="absolute top-full right-0 mt-1 w-[120px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/10 rounded-lg shadow-xl z-50 py-1">
                  {["Activity", "Name"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSortBy(s); setSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[13px] hover:bg-neutral-50 dark:hover:bg-white/5",
                        sortBy === s ? "font-medium text-neutral-900 dark:text-zinc-100" : "text-neutral-500 dark:text-zinc-400"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
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

        {/* Projects list or empty state */}
        {filtered.length === 0 && !searchQuery ? (
          <div className="py-24 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <FolderOpen size={24} className="text-neutral-300 dark:text-zinc-600" />
            </div>
            <p className="text-[14px] text-neutral-400 dark:text-zinc-500 mb-3">No projects yet</p>
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="text-[14px] font-semibold text-neutral-900 dark:text-zinc-100 underline underline-offset-2 hover:no-underline disabled:opacity-50"
            >
              New project
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[14px] text-neutral-400 dark:text-zinc-500">No projects matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 hover:shadow-md hover:border-neutral-300 dark:hover:border-white/15 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <FolderOpen size={16} className="text-neutral-400 dark:text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    {editingId === p.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(p.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(p.id); if (e.key === "Escape") setEditingId(null); }}
                        className="text-[14px] font-medium text-neutral-900 dark:text-zinc-100 bg-transparent border-b border-purple-500 outline-none w-full"
                      />
                    ) : (
                      <p className="text-[14px] font-medium text-neutral-900 dark:text-zinc-100 truncate">{p.name}</p>
                    )}
                    <p className="text-[12px] text-neutral-400 dark:text-zinc-500">
                      {p.workflowCount} workflow{p.workflowCount !== 1 ? "s" : ""} · {formatDistanceToNow(p.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                    title="Rename"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
