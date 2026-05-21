"use client";

import { Handle, Position } from "@xyflow/react";
import { useCanvas } from "@/stores/canvas";
import { HANDLE_COLORS, type HandleType } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Play, X } from "lucide-react";

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
        border: "2px solid white",
        boxShadow: "0 0 0 1px rgba(0,0,0,.08)",
        top,
      }}
    />
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
  const isRunning = useCanvas((s) => s.runningNodeIds.has(id)) || running;
  const onNodesChange = useCanvas((s) => s.onNodesChange);
  return (
    <div
      className={cn(
        "nf-card relative",
        isRunning && "nf-running"
      )}
      style={{ width }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-800 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {badge ?? (
            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
              <Play size={9} fill="currentColor" /> Run
            </span>
          )}
          {closable && (
            <button
              className="p-0.5 rounded hover:bg-red-50 hover:text-red-500 text-neutral-400 transition-colors"
              onClick={() =>
                onNodesChange([{ id, type: "remove" }])
              }
              title="Delete node"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="p-3 text-[12px] text-neutral-700">{children}</div>
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
            "text-[12px] font-medium text-neutral-700 flex items-center gap-1.5",
            side === "right" && "ml-auto"
          )}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: HANDLE_COLORS[type] }}
          />
          {label}
        </span>
        <div className={cn("flex-1", connected && "opacity-40 pointer-events-none")}>
          {children}
        </div>
      </div>
    </div>
  );
}
