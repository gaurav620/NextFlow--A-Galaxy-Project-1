"use client";

import { Handle, Position } from "@xyflow/react";
import { useCanvas } from "@/stores/canvas";
import { HANDLE_COLORS, type HandleType } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Play, X, Loader2, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TypedHandle({
  type,
  id,
  side,
  top,
}: {
  type: HandleType;
  id: string;
  side: "left" | "right";
  top?: number;
}) {
  return (
    <Handle
      type={side === "left" ? "target" : "source"}
      position={side === "left" ? Position.Left : Position.Right}
      id={id}
      style={{
        background: HANDLE_COLORS[type],
        width: 10,
        height: 10,
        border: "2px solid #121218",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
        top,
      }}
    />
  );
}

/**
 * Functional "Run" button — shows per-node state from store.
 */
export function NodeRunButton({ nodeId }: { nodeId?: string } = {}) {
  const isRunning = useCanvas((s) => s.isRunning);
  const nodeState = useCanvas((s) => nodeId ? (s.nodeStates[nodeId] || "idle") : "idle");
  const requestRun = useCanvas((s) => s.requestRun);

  const thisNodeRunning = nodeId ? (nodeState === "running" || nodeState === "queued") : isRunning;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        requestRun(nodeId);
      }}
      disabled={isRunning}
      title={isRunning ? "Workflow is running…" : "Run workflow/node"}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all",
        thisNodeRunning
          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 cursor-not-allowed"
          : isRunning
          ? "bg-white/5 text-zinc-500 cursor-not-allowed"
          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95"
      )}
    >
      {thisNodeRunning ? (
        <Loader2 size={9} className="animate-spin text-purple-400" />
      ) : (
        <Play size={9} fill="currentColor" />
      )}
      {thisNodeRunning ? "Running…" : "Run"}
    </button>
  );
}

function NodeStateBadge({ state }: { state: 'idle' | 'queued' | 'running' | 'success' | 'failed' }) {
  if (state === 'idle') return null;

  let label = '';
  let classes = '';

  switch (state) {
    case 'queued':
      label = 'Queued';
      classes = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      break;
    case 'running':
      label = 'Running';
      classes = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      break;
    case 'success':
      label = 'Done';
      classes = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      break;
    case 'failed':
      label = 'Failed';
      classes = 'bg-red-500/10 text-red-400 border-red-500/20';
      break;
  }

  return (
    <span className={cn(
      "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border font-semibold select-none shrink-0 ml-1.5",
      classes
    )}>
      {state === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse mr-1" />
      )}
      {label}
    </span>
  );
}

export function NodeShell({
  id,
  title,
  icon,
  badge,
  running,
  closable = true,
  children,
  width = 320,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  running?: boolean;
  closable?: boolean;
  children: React.ReactNode;
  width?: number;
}) {
  const dbState = useCanvas((s) => s.nodeStates[id] || "idle");
  const nodeState = running ? "running" : dbState;
  const onNodesChange = useCanvas((s) => s.onNodesChange);

  // Track previous state to fire one-shot flash animations
  // Must use useState (not useRef) so React re-renders when flash class changes
  const [flashClass, setFlashClass] = useState<string | null>(null);
  const prevStateRef = useRef(nodeState);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = nodeState;

    if (prev === "running" && nodeState === "success") {
      setFlashClass("nf-success-flash");
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashClass(null), 1400);
    } else if (prev === "running" && nodeState === "failed") {
      setFlashClass("nf-fail-flash");
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashClass(null), 1400);
    }
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [nodeState]);

  return (
    <div
      className={cn(
        "nf-card relative text-left",
        nodeState === "running" && "nf-running",
        nodeState === "queued" && "nf-queued",
        nodeState === "success" && !flashClass && "nf-success",
        nodeState === "failed" && !flashClass && "nf-error",
        flashClass
      )}
      style={{ width }}
    >
      {/* Animated execution indicator line at top */}
      {nodeState === "running" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px] overflow-hidden">
          <div
            className="h-full w-[60%] animate-[shimmerLine_1.4s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(192,132,252,1), rgba(168,85,247,0.8), transparent)",
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-zinc-100 min-w-0 pr-2">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{title}</span>
          <NodeStateBadge state={nodeState} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {badge !== undefined ? badge : <NodeRunButton nodeId={id} />}
          {closable && (
            <button
              className="p-1 rounded-md hover:bg-red-500/15 hover:text-red-400 text-zinc-500 transition-colors"
              onClick={() => onNodesChange([{ id, type: "remove" }])}
              title="Delete node"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="p-3 text-[12px] text-zinc-300">{children}</div>
    </div>
  );
}

export function FieldRow({
  label,
  type,
  side,
  handleId,
  connected,
  children,
}: {
  label: string;
  type: HandleType;
  side: "left" | "right";
  handleId: string;
  connected?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative py-1.5">
      <TypedHandle type={type} side={side} id={handleId} />
      <div className="flex items-center justify-between gap-2 px-1">
        <span
          className={cn(
            "text-[12px] font-medium text-zinc-300 flex items-center gap-1.5 shrink-0",
            side === "right" && "ml-auto"
          )}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: HANDLE_COLORS[type] }}
          />
          {label}
          {/* Lock icon when connected */}
          {connected && (
            <span title="Value provided by connected node" className="shrink-0">
              <Lock size={9} className="text-zinc-500" />
            </span>
          )}
        </span>
        {/* Disabled overlay with tooltip when connected */}
        <div
          className={cn("flex-1", connected && "opacity-40 pointer-events-none cursor-not-allowed")}
          title={connected ? "Value provided by connected node" : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
