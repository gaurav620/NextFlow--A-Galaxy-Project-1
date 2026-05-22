"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X, ExternalLink } from "lucide-react";
import { renameWorkflow, deleteWorkflow } from "@/app/actions/workflows";
import { cn } from "@/lib/cn";

interface Props {
  id: string;
  name: string;
  updatedAt: string;
  runCount: number;
  hasActiveRun?: boolean;
}

export function WorkflowRow({ id, name, updatedAt, runCount, hasActiveRun }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const next = draft.trim() || "Untitled";
    startTransition(async () => {
      await renameWorkflow(id, next);
      setEditing(false);
    });
  };

  const confirmDelete = () => {
    startTransition(() => {
      deleteWorkflow(id).then(() => {
        setDeleteOpen(false);
      });
    });
  };

  return (
    <>
      <div className="group relative nf-card p-5 cursor-pointer">
        {/* Active run indicator strip */}
        {hasActiveRun && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-emerald-400 rounded-t-[14px]" />
        )}

        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="flex-1 px-2 py-1 text-sm bg-zinc-900/80 border border-white/10 rounded-md focus:outline-none focus:border-purple-500/50 text-zinc-100 placeholder:text-zinc-500"
              />
              <button
                onClick={submit}
                disabled={pending}
                className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-400 rounded text-zinc-400 transition-colors"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => { setDraft(name); setEditing(false); }}
                className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded text-zinc-500 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <Link href={`/workflow/${id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-zinc-200 text-[14px] group-hover:text-purple-300 transition-colors">
                {name}
              </h3>
            </Link>
          )}

          {!editing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/workflow/${id}`}
                className="p-1.5 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Open"
              >
                <ExternalLink size={13} />
              </Link>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Rename"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded text-zinc-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-zinc-500 flex items-center justify-between">
          <span>Edited {new Date(updatedAt).toISOString().slice(0, 16).replace("T", " ")}</span>
          <div className="flex items-center gap-2">
            {hasActiveRun && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Running
              </span>
            )}
            <span className={cn(
              "text-[11px] font-medium",
              runCount > 0 ? "text-zinc-400" : "text-zinc-600"
            )}>
              {runCount} run{runCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {/* Dark Delete Modal */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            className="nf-card max-w-sm w-full mx-4 p-5 animate-[scaleIn_0.15s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 size={15} className="text-red-400" />
              </div>
              <h3 className="font-bold text-zinc-100 text-sm">Delete Workflow</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-200">&quot;{name}&quot;</span>? This will
              permanently remove the workflow and all associated runs.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={pending}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-500/20 disabled:opacity-60 transition-all active:scale-95 flex items-center gap-1.5"
              >
                {pending && (
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
