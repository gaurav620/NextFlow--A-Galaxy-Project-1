"use client";

import type { NodeProps } from "@xyflow/react";
import { NodeShell, FieldRow } from "./shared";
import type { ResponseData } from "@/lib/types";

export function ResponseNode({ id, data }: NodeProps) {
  const d = data as unknown as ResponseData;
  return (
    <NodeShell id={id} title="Response" closable={false} width={260}>
      <FieldRow label="result" type="any" side="left" handleId="result" />
      <div className="mt-3 p-2 text-[11px] bg-neutral-50 rounded min-h-[60px] whitespace-pre-wrap">
        {d.result ?? <span className="text-neutral-400">No result yet</span>}
      </div>
    </NodeShell>
  );
}
