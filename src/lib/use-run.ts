"use client";

import { useCallback, useRef, useState } from "react";
import { useCanvas } from "@/stores/canvas";

type Scope = "full" | "partial" | "single";

interface NodeRunData {
  nodeId: string;
  nodeType: string;
  status: string;
  output: unknown;
  error: string | null;
}

interface RunData {
  run: {
    id: string;
    status: string;
    nodeRuns: NodeRunData[];
  };
}

export function useRun(workflowId: string) {
  const [running, setRunning] = useState(false);
  const setRunningIds = useCanvas((s) => s.setRunning);
  const markRunning = useCanvas((s) => s.markRunning);
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const nodes = useCanvas((s) => s.nodes);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const applyNodeResult = useCallback(
    (nodeId: string, output: unknown) => {
      const latestNodes = nodesRef.current;
      const node = latestNodes.find((n) => n.id === nodeId);
      if (!node) return;
      if (node.type === "gemini") {
        updateNodeData(nodeId, { responseText: formatOutput(output) });
      } else if (node.type === "crop-image") {
        const out = output as { outputUrl?: string } | string | null;
        const url = typeof out === "string" ? out : out?.outputUrl;
        if (url) updateNodeData(nodeId, { outputImageUrl: url });
      } else if (node.type === "response") {
        updateNodeData(nodeId, { result: formatOutput(output) });
      }
    },
    [updateNodeData]
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
        // 1. Start the run
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
        console.log("[useRun] run started:", runId);

        // 2. Mark all target nodes as running
        const targetIds = scope === "full"
          ? currentNodes.map((n) => n.id)
          : (targetNodeIds ?? []);
        targetIds.forEach((id) => markRunning(id, true));

        // 3. Poll for completion
        await pollForResults(runId, markRunning, applyNodeResult);

      } catch (err) {
        console.error("Run error:", err);
      } finally {
        setRunningIds([]);
        setRunning(false);
      }
    },
    [workflowId, running, setRunningIds, markRunning, applyNodeResult]
  );

  return { running, run };
}

/**
 * Poll GET /api/runs/[id] until all nodes are done.
 * Emits UI updates as each node completes.
 */
async function pollForResults(
  runId: string,
  markRunning: (id: string, running: boolean) => void,
  applyNodeResult: (nodeId: string, output: unknown) => void
): Promise<void> {
  const completed = new Set<string>();
  const started = new Set<string>();
  const MAX_POLLS = 200; // 200 × 1.5s = 5 min
  const POLL_INTERVAL = 1500;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) {
        console.warn("[poll] failed to fetch run status:", res.status);
        continue;
      }

      const data = (await res.json()) as RunData;
      const { nodeRuns, status } = data.run;

      // Process each node run
      for (const nr of nodeRuns) {
        // Mark as started (pulsating)
        if (!started.has(nr.nodeId) && (nr.status === "running" || nr.status === "success" || nr.status === "error")) {
          started.add(nr.nodeId);
          markRunning(nr.nodeId, true);
        }

        // Mark as completed
        if (completed.has(nr.nodeId)) continue;

        if (nr.status === "success") {
          completed.add(nr.nodeId);
          markRunning(nr.nodeId, false);
          applyNodeResult(nr.nodeId, nr.output);
        } else if (nr.status === "error") {
          completed.add(nr.nodeId);
          markRunning(nr.nodeId, false);
          console.error(`[poll] node ${nr.nodeId} failed:`, nr.error);
        }
      }

      // Check if run is done
      if (status !== "running") {
        console.log("[useRun] run finished:", status);
        // Clear any remaining running indicators
        for (const nr of nodeRuns) {
          markRunning(nr.nodeId, false);
        }
        return;
      }
    } catch (err) {
      console.warn("[poll] error:", err);
    }
  }

  console.warn("[useRun] polling timed out after", MAX_POLLS, "attempts");
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
