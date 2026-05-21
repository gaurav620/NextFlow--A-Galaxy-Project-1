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

      // Determine which node IDs will run
      const targetIds = scope === "full"
        ? currentNodes.map((n) => n.id)
        : (targetNodeIds ?? []);

      setRunning(true);

      // Mark all nodes as running IMMEDIATELY (before POST returns)
      // This gives instant visual feedback with the pulsating glow
      targetIds.forEach((id) => markRunning(id, true));

      let runId: string | null = null;
      try {
        // POST /api/runs — this awaits the entire execution on the server
        // (up to maxDuration=300s on Vercel Pro, 10s on Hobby)
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

        const data = (await res.json()) as { runId: string };
        runId = data.runId;
        console.log("[useRun] run completed, runId:", runId);

        // Fetch final results and apply to UI
        await applyRunResults(runId, markRunning, applyNodeResult);

      } catch (err) {
        console.error("Run error:", err);
        // If we have a runId, try to poll for partial results
        if (runId) {
          try {
            await applyRunResults(runId, markRunning, applyNodeResult);
          } catch {
            // ignore
          }
        }
      } finally {
        // Clear all running indicators
        setRunningIds([]);
        setRunning(false);
      }
    },
    [workflowId, running, setRunningIds, markRunning, applyNodeResult]
  );

  return { running, run };
}

/**
 * Fetch final run results from DB and apply to UI
 */
async function applyRunResults(
  runId: string,
  markRunning: (id: string, running: boolean) => void,
  applyNodeResult: (nodeId: string, output: unknown) => void
): Promise<void> {
  try {
    const res = await fetch(`/api/runs/${runId}`);
    if (!res.ok) return;

    const data = (await res.json()) as RunData;
    for (const nr of data.run.nodeRuns) {
      markRunning(nr.nodeId, false);
      if (nr.status === "success") {
        applyNodeResult(nr.nodeId, nr.output);
      } else if (nr.status === "error") {
        console.error(`[run] node ${nr.nodeId} error:`, nr.error);
      }
    }
  } catch (err) {
    console.warn("[applyRunResults] error:", err);
  }
}

/**
 * Poll the DB every 1.5s for run completion.
 * Used when POST returns early (e.g. Vercel Hobby 10s timeout hit).
 */
export async function pollForResults(
  runId: string,
  markRunning: (id: string, running: boolean) => void,
  applyNodeResult: (nodeId: string, output: unknown) => void
): Promise<void> {
  const completed = new Set<string>();
  const started = new Set<string>();
  const MAX_POLLS = 200;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) continue;

      const data = (await res.json()) as RunData;
      const { nodeRuns, status } = data.run;

      for (const nr of nodeRuns) {
        if (!started.has(nr.nodeId) && (nr.status === "running" || nr.status === "success" || nr.status === "error")) {
          started.add(nr.nodeId);
          markRunning(nr.nodeId, true);
        }
        if (completed.has(nr.nodeId)) continue;
        if (nr.status === "success") {
          completed.add(nr.nodeId);
          markRunning(nr.nodeId, false);
          applyNodeResult(nr.nodeId, nr.output);
        } else if (nr.status === "error") {
          completed.add(nr.nodeId);
          markRunning(nr.nodeId, false);
        }
      }

      if (status !== "running") return;
    } catch {
      // ignore
    }
  }
}

function formatOutput(output: unknown): string {
  if (output == null) return "";
  if (typeof output === "string") return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}
