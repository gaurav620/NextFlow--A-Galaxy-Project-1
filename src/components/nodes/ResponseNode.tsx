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
            <div className="flex-1 bg-zinc-900/50 rounded-lg border border-white/5 px-2.5 py-1.5 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-zinc-300 truncate flex-1">
                  {src.label}
                </span>
                {src.outputVal ? (
                  <span className="text-[10px] text-zinc-400 truncate max-w-[120px] font-medium" title={src.outputVal}>
                    {src.outputVal.startsWith("http") ? "🖼️ Image" : src.outputVal}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-600 italic shrink-0">
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
          <div className="flex-1 bg-zinc-950/40 rounded-lg border border-dashed border-white/10 px-2.5 py-1.5">
            <span className="text-[11px] text-zinc-500 italic">Connect new input...</span>
          </div>
        </div>

        {/* Result output area */}
        <div
          className={cn(
            "mt-1 p-3 rounded-lg text-[11px] min-h-[64px] transition-all duration-300",
            isRunning
              ? "bg-purple-500/10 border border-purple-500/20 text-purple-300"
              : d.result
              ? "bg-gradient-to-br from-emerald-500/5 to-zinc-900/20 border border-emerald-500/20 text-zinc-200"
              : "bg-zinc-950/40 border border-white/5 text-zinc-500"
          )}
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-purple-400" />
              <span className="italic text-purple-400 font-medium">Running…</span>
            </div>
          ) : d.result ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-2">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Output</span>
              </div>
              {d.result.startsWith("http") && (d.result.includes("placehold") || d.result.includes("transloadit") || d.result.includes("cloudinary") || d.result.includes("amazon") || d.result.includes("uppy")) ? (
                <div className="mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.result}
                    alt="Response output image"
                    className="w-full h-32 object-cover rounded-lg border border-white/10"
                  />
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">{d.result}</p>
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
