"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { deleteWorkflow, renameWorkflow } from "@/app/actions/workflows";

interface Props {
  id: string;
  name: string;
  updatedAt: string;
  runCount: number;
  hasActiveRun: boolean;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Edited ${new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })} ${new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  return `Edited ${new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })} ${new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}

export function WorkflowRow({ id, name: initialName, updatedAt, runCount, hasActiveRun }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteWorkflow(id);
  };

  const handleRenameSubmit = async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== initialName) {
      await renameWorkflow(id, trimmed);
    } else {
      setEditName(initialName);
    }
    setEditing(false);
  };

  return (
    <>
      <Link
        href={`/workflow/${id}`}
        className="block border border-neutral-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-zinc-900/50 hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-none dark:hover:bg-zinc-900 transition-all group"
        onClick={(e) => { if (editing) e.preventDefault(); }}
      >
        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleRenameSubmit(); }
                if (e.key === "Escape") { setEditName(initialName); setEditing(false); }
              }}
              onClick={(e) => e.preventDefault()}
              className="font-semibold text-neutral-900 dark:text-zinc-100 text-sm border border-purple-400 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500/30 bg-white dark:bg-zinc-900 text-sm w-full max-w-[200px]"
            />
          ) : (
            <h3 className="font-semibold text-neutral-900 dark:text-zinc-100 text-sm truncate">{initialName}</h3>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            {/* Rename button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditName(initialName);
                setEditing(true);
              }}
              className="text-neutral-400 hover:text-purple-500 transition-colors p-0.5 rounded"
              title="Rename workflow"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="text-neutral-400 hover:text-red-500 transition-colors p-0.5 rounded"
              title="Delete workflow"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-neutral-500 dark:text-zinc-400">{formatRelative(updatedAt)}</p>
          <div className="flex items-center gap-2">
            {hasActiveRun && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Running
              </span>
            )}
            <span className="text-xs text-neutral-400 dark:text-zinc-500">
              {runCount === 0 ? "0 runs" : runCount === 1 ? "1 run" : `${runCount} runs`}
            </span>
          </div>
        </div>
      </Link>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-xl p-6 w-80 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-neutral-900 dark:text-zinc-100 mb-1">Delete workflow?</h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-5">
              &ldquo;{initialName}&rdquo; and all its run history will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-zinc-300 border border-neutral-200 dark:border-white/10 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

