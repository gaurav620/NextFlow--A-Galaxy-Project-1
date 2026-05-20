"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronRight, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

interface NodeRun {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  durationMs: number | null;
  output: unknown;
  error: string | null;
}

interface Run {
  id: string;
  scope: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  nodeRuns: NodeRun[];
}

interface Props {
  workflowId: string;
  open: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  running: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-red-100 text-red-700",
  partial: "bg-yellow-100 text-yellow-700",
  pending: "bg-neutral-100 text-neutral-500",
};

const STATUS_ICONS: Record<string, string> = {
  running: "⟳",
  success: "✓",
  error: "✕",
  partial: "◐",
  pending: "·",
};

export function HistoryPanel({ workflowId, open, onClose }: Props) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/runs`);
      if (res.ok) {
        const { runs } = (await res.json()) as { runs: Run[] };
        setRuns(runs);
      }
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (open) {
      fetchRuns();
      const t = setInterval(fetchRuns, 4000);
      return () => clearInterval(t);
    }
  }, [open, fetchRuns]);

  if (!open) return null;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-neutral-200 z-20 flex flex-col shadow-xl">
      <div className="h-12 px-4 flex items-center justify-between border-b border-neutral-200">
        <h2 className="text-sm font-semibold">History</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchRuns}
            className="p-1.5 rounded hover:bg-neutral-100"
            title="Refresh"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-neutral-100">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {runs.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500 text-center">No runs yet</div>
        ) : (
          runs.map((r) => (
            <div key={r.id} className="border-b border-neutral-100">
              <button
                onClick={() => toggle(r.id)}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-neutral-50 text-left"
              >
                {expanded.has(r.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider", STATUS_COLORS[r.status])}>
                  {r.status}
                </span>
                <span className="text-xs text-neutral-700 flex-1 truncate">
                  {new Date(r.startedAt).toLocaleTimeString()} — {r.scope}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {r.finishedAt
                    ? `${((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000).toFixed(1)}s`
                    : "…"}
                </span>
              </button>
              {expanded.has(r.id) && (
                <div className="px-4 pb-3 space-y-1">
                  {r.nodeRuns.map((nr) => (
                    <div key={nr.id} className="text-[11px] flex items-start gap-2 py-1 pl-5">
                      <span className={cn("inline-block w-4 text-center", STATUS_COLORS[nr.status] && `text-${nr.status === "success" ? "emerald" : nr.status === "error" ? "red" : "amber"}-600`)}>
                        {STATUS_ICONS[nr.status] ?? "·"}
                      </span>
                      <span className="font-medium min-w-[100px] truncate">{nr.nodeType}</span>
                      <span className="text-neutral-400 w-12">
                        {nr.durationMs != null ? `${(nr.durationMs / 1000).toFixed(1)}s` : ""}
                      </span>
                      <span className="flex-1 text-neutral-600 truncate" title={typeof nr.output === "string" ? nr.output : JSON.stringify(nr.output)}>
                        {nr.error ? nr.error : typeof nr.output === "string" ? nr.output : nr.output ? JSON.stringify(nr.output) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
