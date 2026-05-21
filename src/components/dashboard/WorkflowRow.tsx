"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { renameWorkflow, deleteWorkflow } from "@/app/actions/workflows";

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
      <div className="nf-card p-5 group hover:shadow-md transition bg-white border border-neutral-200 rounded-xl relative">
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
                className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-purple-500"
              />
              <button onClick={submit} disabled={pending} className="p-1.5 hover:bg-neutral-100 rounded">
                <Check size={14} />
              </button>
              <button onClick={() => { setDraft(name); setEditing(false); }} className="p-1.5 hover:bg-neutral-100 rounded">
                <X size={14} />
              </button>
            </div>
          ) : (
            <Link href={`/workflow/${id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold truncate group-hover:text-purple-600 text-neutral-800 text-[14px]">{name}</h3>
            </Link>
          )}
          {!editing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500"
                title="Rename"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-neutral-400"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-neutral-500 flex items-center justify-between">
          <span>Edited {new Date(updatedAt).toISOString().slice(0, 16).replace("T", " ")}</span>
          <div className="flex items-center gap-2">
            {hasActiveRun && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Running
              </span>
            )}
            <span>{runCount} run{runCount === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      {/* Custom delete modal */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs transition-opacity"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 border border-neutral-100 overflow-hidden transform scale-100 transition-all p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={16} />
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm">Delete Workflow</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-5">
              Are you sure you want to delete <span className="font-semibold text-neutral-800">"{name}"</span>? This will permanently remove the workflow and all associated runs. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={pending}
                className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm hover:shadow active:scale-95 disabled:opacity-60 transition flex items-center gap-1.5"
              >
                {pending && <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                Delete Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
