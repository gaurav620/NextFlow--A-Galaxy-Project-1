"use client";

import type { NodeProps } from "@xyflow/react";
import { useCanvas } from "@/stores/canvas";
import { NodeShell, FieldRow } from "./shared";
import type { CropImageData } from "@/lib/types";

export function CropImageNode({ id, data }: NodeProps) {
  const d = data as unknown as CropImageData;
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const edges = useCanvas((s) => s.edges);

  const isConnected = (handle: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handle);

  const onSlider =
    (key: "x" | "y" | "w" | "h") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      updateNodeData(id, { [key]: Number(e.target.value) } as Partial<CropImageData>);

  return (
    <NodeShell id={id} title="Crop Image">
      <div className="space-y-1">
        <FieldRow
          label="Input Image"
          type="image"
          side="left"
          handleId="Input Image"
          connected={isConnected("Input Image")}
        >
          <span className="text-[11px] text-neutral-400 ml-2 truncate">
            {d.inputImageUrl ? "(connected)" : "Upload Image"}
          </span>
        </FieldRow>

        {(["x", "y", "w", "h"] as const).map((key) => {
          const labelMap = { x: "X Position (%)", y: "Y Position (%)", w: "Width (%)", h: "Height (%)" };
          return (
            <FieldRow
              key={key}
              label={labelMap[key]}
              type="text"
              side="left"
              handleId={labelMap[key]}
              connected={isConnected(labelMap[key])}
            >
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={d[key]}
                  onChange={onSlider(key)}
                  disabled={isConnected(labelMap[key])}
                  className="flex-1 accent-purple-600"
                />
                <span className="text-[11px] tabular-nums text-neutral-500 w-8 text-right">
                  {d[key]}
                </span>
              </div>
            </FieldRow>
          );
        })}

        <div className="mt-2 border-t border-neutral-100 pt-2 relative">
          <FieldRow label="Output Image" type="image" side="right" handleId="Output Image" />
          {d.outputImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.outputImageUrl} alt="" className="w-full h-24 object-cover rounded mt-2" />
          )}
        </div>
      </div>
    </NodeShell>
  );
}
