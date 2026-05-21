"use client";

import { useCallback } from "react";
import { useCanvas } from "@/stores/canvas";

type Scope = "full" | "partial" | "single";

interface NodeRunData {
  nodeId: string;
  nodeType: string;
  status: string;
  output: unknown;
  error: string | null;
  durationMs?: number | null;
}

interface RunData {
  run: {
    id: string;
    status: string;
    nodeRuns: NodeRunData[];
  };
}

export function useRun(workflowId: string) {
  const isRunning = useCanvas((s) => s.isRunning);
  const setIsRunning = useCanvas((s) => s.setIsRunning);
  const setRunningIds = useCanvas((s) => s.setRunning);
  const markRunning = useCanvas((s) => s.markRunning);
  const updateNodeData = useCanvas((s) => s.updateNodeData);

  const applyNodeResult = useCallback(
    (nodeId: string, nodeType: string, output: unknown) => {
      const text = extractText(output);
      const imageUrl = extractImageUrl(output);

      if (nodeType === "gemini") {
        if (text) updateNodeData(nodeId, { responseText: text });
      } else if (nodeType === "crop-image") {
        if (imageUrl) updateNodeData(nodeId, { outputImageUrl: imageUrl });
      } else if (nodeType === "response") {
        updateNodeData(nodeId, { result: text ?? formatOutput(output) });
      }
    },
    [updateNodeData]
  );

  const run = useCallback(
    async (scope: Scope = "full", targetNodeId?: string) => {
      if (isRunning) return;
      if (!workflowId) return;

      // Build targetNodeIds
      const targetNodeIds: string[] | undefined =
        targetNodeId ? [targetNodeId]
        : scope === "full" ? undefined
        : undefined;

      // Mark all as running immediately
      setIsRunning(true);

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 290_000);

        let res: Response;
        try {
          res = await fetch("/api/runs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workflowId,
              scope: targetNodeIds ? "partial" : "full",
              targetNodeIds,
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);
        } catch (fetchErr) {
          clearTimeout(timer);
          if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
            console.warn("[useRun] Request timeout");
          }
          return;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("[useRun] run start failed:", res.status, text);
          return;
        }

        const data = (await res.json()) as { runId: string };
        const runId = data.runId;
        console.log("[useRun] run done, runId:", runId);

        // Fetch final results and apply to UI
        await applyFinalResults(runId, markRunning, applyNodeResult);
      } catch (err) {
        console.error("[useRun] error:", err);
      } finally {
        setRunningIds([]);
        setIsRunning(false);
      }
    },
    [workflowId, isRunning, setIsRunning, setRunningIds, markRunning, applyNodeResult]
  );

  return { running: isRunning, run };
}

async function applyFinalResults(
  runId: string,
  markRunning: (id: string, v: boolean) => void,
  applyNodeResult: (id: string, type: string, output: unknown) => void
) {
  try {
    const res = await fetch(`/api/runs/${runId}`);
    if (!res.ok) return;
    const data = (await res.json()) as RunData;
    for (const nr of data.run.nodeRuns) {
      markRunning(nr.nodeId, false);
      if (nr.status === "success") {
        applyNodeResult(nr.nodeId, nr.nodeType, nr.output);
      } else if (nr.status === "error") {
        console.error(`[run] node ${nr.nodeId} error:`, nr.error);
      }
    }
  } catch (err) {
    console.warn("[applyFinalResults]", err);
  }
}

function extractText(output: unknown): string | null {
  if (typeof output === "string") return output || null;
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (typeof o.responseText === "string") return o.responseText;
    if (typeof o.result === "string") return o.result;
  }
  return null;
}

function extractImageUrl(output: unknown): string | null {
  if (typeof output === "string" && (output.startsWith("http://") || output.startsWith("https://"))) {
    return output;
  }
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (typeof o.outputUrl === "string") return o.outputUrl;
    if (typeof o.imageUrl === "string") return o.imageUrl;
  }
  return null;
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
