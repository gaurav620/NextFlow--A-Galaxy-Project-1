"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteWorkflow } from "@/app/actions/workflows";

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

export function WorkflowRow({ id, name, updatedAt, runCount, hasActiveRun }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteWorkflow(id);
  };

  return (
    <>
      <Link
        href={`/workflow/${id}`}
        className="block border border-neutral-200 rounded-xl p-4 bg-white hover:border-neutral-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900 text-sm truncate">{name}</h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all shrink-0 p-0.5 rounded"
            title="Delete workflow"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-neutral-500">{formatRelative(updatedAt)}</p>
          <div className="flex items-center gap-2">
            {hasActiveRun && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Running
              </span>
            )}
            <span className="text-xs text-neutral-400">
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
            className="bg-white border border-neutral-200 rounded-2xl shadow-xl p-6 w-80 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Delete workflow?</h3>
            <p className="text-xs text-neutral-500 mb-5">
              &ldquo;{name}&rdquo; and all its run history will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
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
