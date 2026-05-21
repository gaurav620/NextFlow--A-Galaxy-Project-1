"use client";

import type { NodeProps } from "@xyflow/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { NodeShell, FieldRow } from "./shared";
import { useCanvas } from "@/stores/canvas";
import type { ResponseData } from "@/lib/types";
import { cn } from "@/lib/cn";

export function ResponseNode({ id, data }: NodeProps) {
  const d = data as unknown as ResponseData;
  const isRunning = useCanvas((s) => s.runningNodeIds.has(id));

  return (
    <NodeShell id={id} title="Response" closable={false} width={280}>
      <div className="space-y-2">
        {/* Input handle row */}
        <FieldRow label="result" type="any" side="left" handleId="result" />

        {/* Result output area */}
        <div
          className={cn(
            "mt-1 p-3 rounded-lg text-[11px] min-h-[64px] transition-all duration-300",
            isRunning
              ? "bg-purple-50 border border-purple-200 text-purple-700"
              : d.result
              ? "bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 text-neutral-700"
              : "bg-neutral-50 border border-neutral-200 text-neutral-400"
          )}
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-purple-500" />
              <span className="italic text-purple-500">Running…</span>
            </div>
          ) : d.result ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Output</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-neutral-700">{d.result}</p>
            </div>
          ) : (
            <span className="italic">No result yet — run the workflow</span>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
