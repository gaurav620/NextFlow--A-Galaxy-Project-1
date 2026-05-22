"use client";

import type { NodeProps } from "@xyflow/react";
import { Loader2, Crop } from "lucide-react";
import { useCanvas } from "@/stores/canvas";
import { NodeShell, FieldRow } from "./shared";
import type { CropImageData } from "@/lib/types";

export function CropImageNode({ id, data }: NodeProps) {
  const d = data as unknown as CropImageData;
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const edges = useCanvas((s) => s.edges);
  const isRunning = useCanvas((s) => s.runningNodeIds.has(id));

  const isConnected = (handle: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handle);

  const onSlider =
    (key: "x" | "y" | "w" | "h") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      updateNodeData(id, { [key]: Number(e.target.value) } as Partial<CropImageData>);

  return (
    <NodeShell
      id={id}
      title="Crop Image"
      icon={<Crop size={12} className="text-amber-400" />}
    >
      <div className="space-y-1.5">
        {/* Input image handle */}
        <FieldRow
          label="Input Image"
          type="image"
          side="left"
          handleId="Input Image"
          connected={isConnected("Input Image")}
        >
          <span className="text-[11px] text-neutral-400 dark:text-zinc-500 ml-1.5 italic">
            {isConnected("Input Image") ? "Connected ✓" : "Connect image output"}
          </span>
        </FieldRow>

        {/* X/Y/W/H sliders */}
        {(["x", "y", "w", "h"] as const).map((key) => {
          const labelMap = { x: "X Position (%)", y: "Y Position (%)", w: "Width (%)", h: "Height (%)" };
          const connected = isConnected(labelMap[key]);
          return (
            <FieldRow
              key={key}
              label={labelMap[key]}
              type="text"
              side="left"
              handleId={labelMap[key]}
              connected={connected}
            >
              <div className="flex items-center gap-2 ml-1.5">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={d[key] ?? 0}
                  onChange={onSlider(key)}
                  disabled={connected}
                  className="flex-1 accent-amber-500 disabled:opacity-30 cursor-pointer"
                />
                <span className="text-[11px] tabular-nums text-neutral-500 dark:text-zinc-400 w-8 text-right font-semibold">
                  {d[key] ?? 0}
                </span>
              </div>
            </FieldRow>
          );
        })}

        {/* Output */}
        <div className="mt-2 border-t border-neutral-100 dark:border-white/5 pt-2 relative">
          <FieldRow label="Output Image" type="image" side="right" handleId="Output Image" />

          {/* Running state */}
          {isRunning && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-2.5">
              <Loader2 size={11} className="animate-spin" />
              <span className="italic">Processing image…</span>
            </div>
          )}

          {/* Output preview */}
          {!isRunning && d.outputImageUrl && (
            <div className="mt-2" style={{ animation: "fadeIn 0.3s ease-out" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.outputImageUrl}
                alt="Crop output"
                className="w-full h-24 object-cover rounded-lg border border-neutral-200 dark:border-white/10"
              />
              <p className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-1 truncate" title={d.outputImageUrl}>
                {d.outputImageUrl.slice(0, 50)}…
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isRunning && !d.outputImageUrl && (
            <div className="mt-2 h-16 rounded-lg border border-dashed border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-950/40 flex items-center justify-center">
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 italic">Output will appear here</span>
            </div>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
