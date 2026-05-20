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
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const next = draft.trim() || "Untitled";
    startTransition(async () => {
      await renameWorkflow(id, next);
      setEditing(false);
    });
  };

  const onDelete = () => {
    if (!confirm(`Delete "${name}"?`)) return;
    startTransition(() => deleteWorkflow(id));
  };

  return (
    <div className="nf-card p-5 group hover:shadow-md transition">
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
            <h3 className="font-semibold truncate group-hover:text-purple-600">{name}</h3>
          </Link>
        )}
        {!editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 hover:bg-neutral-100 rounded"
              title="Rename"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded"
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
  );
}
