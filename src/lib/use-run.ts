"use client";

import { useCallback, useRef, useState } from "react";
import { useCanvas } from "@/stores/canvas";

type Scope = "full" | "partial" | "single";

interface ServerEvent {
  type: "hello" | "node-start" | "node-finish" | "node-error" | "run-finish" | "run-error";
  runId?: string;
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
        // POST /api/runs returns an SSE stream with execution events inline.
        // The serverless function stays alive while execution runs.
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

        // Check if we got a streaming response
        if (res.body) {
          let runId: string | null = null;
          await readSSEStream(res.body, (evt) => {
            if (evt.type === "hello" && evt.runId) {
              runId = evt.runId;
            }
            handleEvent(evt);
          });

          // If the stream ended early (before run-finish), poll for completion
          if (runId) {
            // Give a tiny delay then check if run is still active
            await new Promise((r) => setTimeout(r, 500));
            try {
              const checkRes = await fetch(`/api/runs/${runId}`);
              if (checkRes.ok) {
                const data = (await checkRes.json()) as { run: { status: string } };
                if (data.run.status === "running") {
                  console.warn("Stream ended but run still active, falling back to poll");
                  await pollForCompletion(runId, handleEvent);
                }
              }
            } catch {
              // ignore
            }
          }
        } else {
          // Fallback: response has no body (shouldn't happen but handle gracefully)
          // Try to parse as JSON
          try {
            const json = await res.json() as { runId?: string };
            if (json.runId) {
              await pollForCompletion(json.runId, handleEvent);
            }
          } catch {
            console.error("No stream body and no JSON — cannot read run results");
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

/** Read an SSE stream from a ReadableStream body */
async function readSSEStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (evt: ServerEvent) => void
): Promise<void> {
  const reader = body.getReader();
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
        onEvent(evt);
      } catch {
        // ignore parse errors
      }
    }
  }

  // Process remaining buffer
  if (buffer.startsWith("data: ")) {
    try {
      const evt = JSON.parse(buffer.slice(6)) as ServerEvent;
      onEvent(evt);
    } catch {
      // ignore
    }
  }
}

/** Poll the DB for run completion and emit events from node results */
async function pollForCompletion(
  runId: string,
  handleEvent: (evt: ServerEvent) => void
): Promise<void> {
  const seen = new Set<string>();
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        run: {
          status: string;
          nodeRuns: {
            nodeId: string;
            nodeType: string;
            status: string;
            output: unknown;
            error: string | null;
          }[];
        };
      };

      // Emit events for any newly completed nodes
      for (const nr of data.run.nodeRuns) {
        if (seen.has(nr.nodeId)) continue;
        if (nr.status === "running" && !seen.has(`start-${nr.nodeId}`)) {
          seen.add(`start-${nr.nodeId}`);
          handleEvent({ type: "node-start", nodeId: nr.nodeId });
        }
        if (nr.status === "success") {
          seen.add(nr.nodeId);
          handleEvent({ type: "node-finish", nodeId: nr.nodeId, output: nr.output });
        } else if (nr.status === "error") {
          seen.add(nr.nodeId);
          handleEvent({ type: "node-error", nodeId: nr.nodeId, error: nr.error ?? "Unknown error" });
        }
      }

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
