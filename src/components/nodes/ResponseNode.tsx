"use client";

import type { NodeProps } from "@xyflow/react";
import { CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { NodeShell, TypedHandle } from "./shared";
import { useCanvas } from "@/stores/canvas";
import type { ResponseData } from "@/lib/types";
import { cn } from "@/lib/cn";

export function ResponseNode({ id, data }: NodeProps) {
  const d = data as unknown as ResponseData;
  const isRunning = useCanvas((s) => s.runningNodeIds.has(id));
  const edges = useCanvas((s) => s.edges);
  const nodes = useCanvas((s) => s.nodes);

  // Find all edges targeting this node and get their source node labels and outputs
  const connectedSources = edges
    .filter((e) => e.target === id)
    .map((e) => {
      const srcNode = nodes.find((n) => n.id === e.source);
      const srcData = srcNode?.data as Record<string, unknown> | undefined;
      // Use model label for gemini nodes, or node type otherwise
      const label =
        (srcData?.model as string) ||
        (srcNode?.type === "crop-image" ? "Crop Image" : "") ||
        (srcNode?.type === "request-inputs" ? "Request Inputs" : "") ||
        srcNode?.type ||
        e.source;

      // Extract output value from source node
      let outputVal: string | undefined = undefined;
      if (srcNode?.type === "gemini") {
        outputVal = srcData?.responseText as string | undefined;
      } else if (srcNode?.type === "crop-image") {
        outputVal = srcData?.outputImageUrl as string | undefined;
      } else if (srcNode?.type === "request-inputs") {
        const fields = (srcData?.fields || []) as Array<{ key: string; value?: string }>;
        const field = fields.find((f) => f.key === e.sourceHandle);
        outputVal = field?.value;
      }

      return {
        edgeId: e.id,
        sourceId: e.source,
        label,
        targetHandle: e.targetHandle,
        outputVal,
      };
    });

  return (
    <NodeShell id={id} title="Response" closable={false} width={280} icon={<MessageSquare size={12} className="text-purple-400" />}>
      <div className="space-y-2">
        {/* Labeled connected input rows */}
        {connectedSources.map((src, idx) => (
          <div key={src.edgeId} className="relative flex items-center gap-2 py-0.5">
            {/* Handle on left side */}
            <TypedHandle
              type="text"
              side="left"
              id={src.targetHandle ?? `result_${idx}`}
              top={28 + idx * 36}
            />
            <div className="flex-1 bg-neutral-50 dark:bg-zinc-900/50 rounded-lg border border-neutral-200 dark:border-white/5 px-2.5 py-1.5 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-zinc-300 truncate flex-1">
                  {src.label}
                </span>
                {src.outputVal ? (
                  <span className="text-[10px] text-neutral-500 dark:text-zinc-400 truncate max-w-30 font-medium" title={src.outputVal}>
                    {src.outputVal.startsWith("http") ? "🖼️ Image" : src.outputVal}
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400 dark:text-zinc-600 italic shrink-0">
                    No output yet
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Always show a default input/drop handle at the bottom for dragging new connections */}
        <div className="relative flex items-center gap-2 py-0.5">
          <TypedHandle
            type="text"
            side="left"
            id="result"
            top={28 + connectedSources.length * 36}
          />
          <div className="flex-1 bg-neutral-50 dark:bg-zinc-950/40 rounded-lg border border-dashed border-neutral-200 dark:border-white/10 px-2.5 py-1.5">
            <span className="text-[11px] text-neutral-400 dark:text-zinc-500 italic">Connect new input...</span>
          </div>
        </div>

        {/* Result output area */}
        <div
          className={cn(
            "mt-1 p-3 rounded-lg text-[11px] min-h-16 transition-all duration-300",
            isRunning
              ? "bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-300"
              : d.result
              ? "bg-emerald-50 dark:bg-linear-to-br dark:from-emerald-500/5 dark:to-zinc-900/20 border border-emerald-200 dark:border-emerald-500/20 text-neutral-800 dark:text-zinc-200"
              : "bg-neutral-50 dark:bg-zinc-950/40 border border-neutral-200 dark:border-white/5 text-neutral-400 dark:text-zinc-500"
          )}
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-purple-500 dark:text-purple-400" />
              <span className="italic font-medium">Running…</span>
            </div>
          ) : d.result ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-2">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Output</span>
              </div>
              {d.result.startsWith("http") && (d.result.includes("placehold") || d.result.includes("transloadit") || d.result.includes("cloudinary") || d.result.includes("amazon") || d.result.includes("uppy")) ? (
                <div className="mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.result}
                    alt="Response output image"
                    className="w-full h-32 object-cover rounded-lg border border-neutral-200 dark:border-white/10"
                  />
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{d.result}</p>
              )}
            </div>
          ) : (
            <span className="italic">No output yet</span>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
