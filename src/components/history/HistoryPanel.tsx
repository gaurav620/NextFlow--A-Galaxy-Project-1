"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronRight, X, RefreshCw, ChevronDown as FilterArrow } from "lucide-react";
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

type RunTab = "UI Runs" | "API Runs";
type StatusFilter = "All" | "Queued" | "Running" | "Waiting" | "Completed" | "Failed" | "Canceled";

const STATUS_COLORS: Record<string, string> = {
  running:  "bg-amber-50 text-amber-600 border-amber-200",
  success:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed:"bg-emerald-50 text-emerald-700 border-emerald-200",
  error:    "bg-red-50 text-red-600 border-red-200",
  failed:   "bg-red-50 text-red-600 border-red-200",
  partial:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  pending:  "bg-neutral-100 text-neutral-500 border-neutral-200",
  queued:   "bg-blue-50 text-blue-600 border-blue-200",
  waiting:  "bg-orange-50 text-orange-600 border-orange-200",
  canceled: "bg-neutral-100 text-neutral-400 border-neutral-200",
};

const STATUS_DOT: Record<string, string> = {
  running:  "bg-amber-400",
  success:  "bg-emerald-500",
  completed:"bg-emerald-500",
  error:    "bg-red-500",
  failed:   "bg-red-500",
  partial:  "bg-yellow-400",
  pending:  "bg-neutral-300",
  queued:   "bg-blue-400",
  waiting:  "bg-orange-400",
  canceled: "bg-neutral-300",
};

const STATUS_FILTERS: StatusFilter[] = ["All", "Queued", "Running", "Waiting", "Completed", "Failed", "Canceled"];

function formatDuration(start: string, end: string | null): string {
  if (!end) return "…";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function mapStatus(s: string): string {
  if (s === "success") return "completed";
  return s.toLowerCase();
}

/** Format any node output for display in the history panel */
function formatNodeOutput(output: unknown): string {
  if (output == null) return "";
  if (typeof output === "string") {
    // Truncate long strings (e.g. Gemini response)
    return output.length > 80 ? output.slice(0, 80) + "…" : output;
  }
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>;
    // crop-image output: { outputUrl: "..." }
    if (typeof obj.outputUrl === "string") return `🖼 ${obj.outputUrl.slice(0, 60)}`;
    // request-inputs output: { text_field: "...", image_field: "..." }
    const keys = Object.keys(obj);
    if (keys.length > 0) {
      const preview = keys.map((k) => {
        const v = obj[k];
        return `${k}: ${typeof v === "string" ? v.slice(0, 30) : "…"}`;
      }).join(", ");
      return `{${preview}}`.slice(0, 80);
    }
  }
  return String(output).slice(0, 80);
}

export function HistoryPanel({ workflowId, open, onClose }: Props) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<RunTab>("UI Runs");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [filterOpen, setFilterOpen] = useState(false);

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

  const filteredRuns = runs.filter((r) => {
    if (statusFilter === "All") return true;
    const mapped = mapStatus(r.status);
    return mapped === statusFilter.toLowerCase();
  });

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[340px] bg-white border-l border-neutral-200 z-20 flex flex-col shadow-2xl animate-[slideInRight_0.2s_ease-out]">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200 shrink-0">
        <h2 className="text-sm font-semibold text-neutral-900">Execution History</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchRuns}
            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab row: UI Runs / API Runs */}
      <div className="px-4 pt-3 pb-0 flex gap-0 border-b border-neutral-200">
        {(["UI Runs", "API Runs"] as RunTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px",
              tab === t
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-100">
        <span className="text-xs font-medium text-neutral-600">Run history</span>
        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded-md hover:bg-neutral-100 transition-colors"
          >
            {statusFilter}
            <FilterArrow size={11} className={cn("transition-transform", filterOpen && "rotate-180")} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg z-30 py-1 overflow-hidden">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 flex items-center gap-2",
                    statusFilter === s && "font-medium text-neutral-900",
                    statusFilter !== s && "text-neutral-600"
                  )}
                >
                  {statusFilter === s && (
                    <span className="text-purple-600">✓</span>
                  )}
                  {statusFilter !== s && <span className="w-3" />}
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" onClick={() => filterOpen && setFilterOpen(false)}>
        {filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <RefreshCw size={18} className="text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500">No runs for this filter yet.</p>
          </div>
        ) : (
          filteredRuns.map((r) => {
            const mapped = mapStatus(r.status);
            return (
              <div key={r.id} className="border-b border-neutral-100 last:border-0">
                <button
                  onClick={() => toggle(r.id)}
                  className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-neutral-50 text-left transition-colors"
                >
                  {expanded.has(r.id) ? (
                    <ChevronDown size={12} className="text-neutral-400 shrink-0" />
                  ) : (
                    <ChevronRight size={12} className="text-neutral-400 shrink-0" />
                  )}
                  {/* Status dot */}
                  <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[mapped] ?? "bg-neutral-300")} />
                  {/* Status badge */}
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md border capitalize",
                    STATUS_COLORS[mapped] ?? STATUS_COLORS.pending
                  )}>
                    {mapped}
                  </span>
                  <span className="text-xs text-neutral-600 flex-1 truncate">
                    {new Date(r.startedAt).toLocaleTimeString()}
                  </span>
                  <span className="text-[11px] text-neutral-400 shrink-0">
                    {formatDuration(r.startedAt, r.finishedAt)}
                  </span>
                </button>

                {expanded.has(r.id) && (
                  <div className="px-4 pb-3 space-y-1 bg-neutral-50/50">
                    {r.nodeRuns.map((nr) => {
                      const nMapped = mapStatus(nr.status);
                      return (
                        <div key={nr.id} className="text-[11px] flex items-center gap-2 py-1 pl-7">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[nMapped] ?? "bg-neutral-300")} />
                          <span className="font-medium text-neutral-700 min-w-[90px] truncate">{nr.nodeType}</span>
                          <span className="text-neutral-400 w-10 shrink-0">
                            {nr.durationMs != null ? `${(nr.durationMs / 1000).toFixed(1)}s` : ""}
                          </span>
                          <span
                            className="flex-1 text-neutral-500 truncate"
                            title={nr.error ?? formatNodeOutput(nr.output)}
                          >
                            {nr.error ? (
                              <span className="text-red-500">{nr.error}</span>
                            ) : (
                              <span>{formatNodeOutput(nr.output)}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
