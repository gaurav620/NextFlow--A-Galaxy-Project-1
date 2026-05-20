"use client";

import { useCallback, useRef, useState } from "react";
import { useCanvas } from "@/stores/canvas";

type Scope = "full" | "partial" | "single";

interface ServerEvent {
  type: "hello" | "node-start" | "node-finish" | "node-error" | "run-finish";
  nodeId?: string;
  output?: unknown;
  error?: string;
}

export function useRun(workflowId: string) {
  const [running, setRunning] = useState(false);
  const setRunningIds = useCanvas((s) => s.setRunning);
  const markRunning = useCanvas((s) => s.markRunning);
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const nodes = useCanvas((s) => s.nodes);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const handleEvent = useCallback(
    (evt: ServerEvent) => {
      if (evt.type === "node-start" && evt.nodeId) {
        markRunning(evt.nodeId, true);
      } else if (evt.type === "node-finish" && evt.nodeId) {
        markRunning(evt.nodeId, false);
        const latestNodes = nodesRef.current;
        const node = latestNodes.find((n) => n.id === evt.nodeId);
        if (!node) return;
        if (node.type === "gemini") {
          updateNodeData(evt.nodeId, { responseText: formatOutput(evt.output) });
        } else if (node.type === "crop-image") {
          const out = evt.output as { outputUrl?: string } | string | null;
          const url = typeof out === "string" ? out : out?.outputUrl;
          if (url) updateNodeData(evt.nodeId, { outputImageUrl: url });
        } else if (node.type === "response") {
          updateNodeData(evt.nodeId, { result: formatOutput(evt.output) });
        }
      } else if (evt.type === "node-error" && evt.nodeId) {
        markRunning(evt.nodeId, false);
      }
    },
    [markRunning, updateNodeData]
  );

  const run = useCallback(
    async (overrideScope?: Scope) => {
      if (running) return;
      const currentNodes = nodesRef.current;
      const selected = currentNodes.filter((n) => n.selected).map((n) => n.id);
      const scope: Scope =
        overrideScope ??
        (selected.length === 0
          ? "full"
          : selected.length === 1
          ? "single"
          : "partial");
      const targetNodeIds = scope === "full" ? undefined : selected;

      setRunning(true);
      try {
        // 1. Start the run (returns runId)
        const res = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowId, scope, targetNodeIds }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("Run start failed:", res.status, text);
          throw new Error(`run failed: ${res.status}`);
        }
        const { runId } = (await res.json()) as { runId: string };

        // 2. Open the SSE stream to receive execution events
        const streamRes = await fetch(`/api/runs/${runId}/stream`);
        if (!streamRes.ok || !streamRes.body) {
          // If stream fails, poll the DB for completion
          console.warn("Stream unavailable, falling back to poll");
          await pollForCompletion(runId);
          return;
        }

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6)) as ServerEvent;
              handleEvent(evt);
            } catch {
              // ignore parse errors
            }
          }
        }

        // Process remaining buffer
        if (buffer.startsWith("data: ")) {
          try {
            const evt = JSON.parse(buffer.slice(6)) as ServerEvent;
            handleEvent(evt);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Run error:", err);
      } finally {
        setRunningIds([]);
        setRunning(false);
      }
    },
    [workflowId, running, setRunningIds, handleEvent]
  );

  return { running, run };
}

/** Poll the DB for run completion (fallback when SSE is unavailable) */
async function pollForCompletion(runId: string): Promise<void> {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) continue;
      const data = (await res.json()) as { run: { status: string } };
      if (data.run.status !== "running") return;
    } catch {
      // ignore
    }
  }
}

/** Safely format any output value as a display string */
function formatOutput(output: unknown): string {
  if (output == null) return "";
  if (typeof output === "string") return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}
