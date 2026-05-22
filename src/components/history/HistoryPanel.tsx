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
  running:  "bg-amber-500/10 text-amber-400 border-amber-500/25",
  success:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  completed:"bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  error:    "bg-red-500/10 text-red-400 border-red-500/25",
  failed:   "bg-red-500/10 text-red-400 border-red-500/25",
  partial:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  pending:  "bg-zinc-850/50 text-zinc-500 border-white/5",
  queued:   "bg-blue-500/10 text-blue-400 border-blue-500/25",
  waiting:  "bg-orange-500/10 text-orange-400 border-orange-500/25",
  canceled: "bg-zinc-850/50 text-zinc-500 border-white/5",
};

const STATUS_DOT: Record<string, string> = {
  running:  "bg-amber-400",
  success:  "bg-emerald-500",
  completed:"bg-emerald-500",
  error:    "bg-red-500",
  failed:   "bg-red-500",
  partial:  "bg-yellow-400",
  pending:  "bg-zinc-600",
  queued:   "bg-blue-400",
  waiting:  "bg-orange-400",
  canceled: "bg-zinc-500",
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
    <aside className="absolute right-0 top-0 bottom-0 w-[340px] bg-zinc-950/80 border-l border-white/5 z-20 flex flex-col shadow-2xl backdrop-blur-md animate-[slideInRight_0.2s_ease-out]">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
        <h2 className="text-sm font-bold text-zinc-100">Execution History</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchRuns}
            className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab row: UI Runs / API Runs */}
      <div className="px-4 pt-3 pb-0 flex gap-0 border-b border-white/5">
        {(["UI Runs", "API Runs"] as RunTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px",
              tab === t
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
        <span className="text-xs font-medium text-zinc-400">Run history</span>
        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
          >
            {statusFilter}
            <FilterArrow size={11} className={cn("transition-transform", filterOpen && "rotate-180")} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl z-30 py-1 overflow-hidden backdrop-blur-md">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center gap-2 transition-colors",
                    statusFilter === s && "font-semibold text-zinc-100",
                    statusFilter !== s && "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {statusFilter === s && (
                    <span className="text-purple-400">✓</span>
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
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
              <RefreshCw size={18} className="text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No runs for this filter yet.</p>
          </div>
        ) : (
          filteredRuns.map((r) => {
            const mapped = mapStatus(r.status);
            return (
              <div key={r.id} className="border-b border-white/5 last:border-0">
                <button
                  onClick={() => toggle(r.id)}
                  className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-white/5 text-left transition-colors"
                >
                  {expanded.has(r.id) ? (
                    <ChevronDown size={12} className="text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronRight size={12} className="text-zinc-500 shrink-0" />
                  )}
                  {/* Status dot */}
                  <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[mapped] ?? "bg-zinc-600")} />
                  {/* Status badge */}
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
                    STATUS_COLORS[mapped] ?? STATUS_COLORS.pending
                  )}>
                    {mapped}
                  </span>
                  <span className="text-xs text-zinc-400 flex-1 truncate font-medium">
                    {new Date(r.startedAt).toLocaleTimeString()}
                  </span>
                  <span className="text-[11px] text-zinc-500 shrink-0 font-medium">
                    {formatDuration(r.startedAt, r.finishedAt)}
                  </span>
                </button>

                {expanded.has(r.id) && (
                  <div className="px-4 pb-3 space-y-1.5 bg-zinc-900/20">
                    {r.nodeRuns.map((nr) => {
                      const nMapped = mapStatus(nr.status);
                      return (
                        <div key={nr.id} className="text-[11px] flex items-center gap-2 py-1 pl-7">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[nMapped] ?? "bg-zinc-600")} />
                          <span className="font-semibold text-zinc-300 min-w-[90px] truncate">{nr.nodeType}</span>
                          <span className="text-zinc-500 w-10 shrink-0 font-medium">
                            {nr.durationMs != null ? `${(nr.durationMs / 1000).toFixed(1)}s` : ""}
                          </span>
                          <span
                            className="flex-1 text-zinc-400 truncate"
                            title={nr.error ?? formatNodeOutput(nr.output)}
                          >
                            {nr.error ? (
                              <span className="text-red-400">{nr.error}</span>
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
