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
  const activeRunId = useCanvas((s) => s.activeRunId);
  const setIsRunning = useCanvas((s) => s.setIsRunning);
  const setActiveRunId = useCanvas((s) => s.setActiveRunId);
  const setRunningIds = useCanvas((s) => s.setRunning);
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const setNodeState = useCanvas((s) => s.setNodeState);
  const resetNodeStates = useCanvas((s) => s.resetNodeStates);

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

  const cancelRun = useCallback(async () => {
    const runId = activeRunId ?? useCanvas.getState().activeRunId;
    if (runId) {
      try {
        await fetch(`/api/runs/${runId}/cancel`, { method: "POST" });
      } catch {
        // best effort
      }
    }
    setRunningIds([]);
    setIsRunning(false);
    setActiveRunId(null);
    resetNodeStates();
  }, [activeRunId, setRunningIds, setIsRunning, setActiveRunId, resetNodeStates]);

  const run = useCallback(
    async (scope: Scope = "full", targetNodeIds?: string[]) => {
      if (isRunning) return;
      if (!workflowId) return;

      setIsRunning(true);
      resetNodeStates();

      const clientRunId = `run_${Math.random().toString(36).slice(2, 11)}`;
      setActiveRunId(clientRunId);

      let es: EventSource | null = null;
      let pollInterval: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        if (es) { es.close(); es = null; }
        setRunningIds([]);
        setIsRunning(false);
        setActiveRunId(null);
      };

      const poll = async () => {
        try {
          const res = await fetch(`/api/runs/${clientRunId}`);
          if (!res.ok) return;
          const data = (await res.json()) as RunData;

          for (const nr of data.run.nodeRuns) {
            if (nr.status === "running") {
              setNodeState(nr.nodeId, "running");
            } else if (nr.status === "success") {
              setNodeState(nr.nodeId, "success");
              applyNodeResult(nr.nodeId, nr.nodeType, nr.output);
            } else if (nr.status === "error" || nr.status === "failed") {
              setNodeState(nr.nodeId, "failed");
            } else if (nr.status === "pending") {
              setNodeState(nr.nodeId, "queued");
            }
          }

          const done = data.run.status !== "running" && data.run.status !== "pending";
          if (done) cleanup();
        } catch (err) {
          console.warn("[useRun] polling error:", err);
        }
      };

      try {
        // 1. Open SSE stream for real-time updates
        es = new EventSource(`/api/runs/${clientRunId}/stream`);
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "node-queued" && data.nodeId) {
              setNodeState(data.nodeId, "queued");
            } else if (data.type === "node-start" && data.nodeId) {
              setNodeState(data.nodeId, "running");
            } else if (data.type === "node-finish" && data.nodeId) {
              setNodeState(data.nodeId, "success");
              applyNodeResult(data.nodeId, data.nodeType, data.output);
            } else if (data.type === "node-error" && data.nodeId) {
              setNodeState(data.nodeId, "failed");
            } else if (data.type === "run-finish") {
              cleanup();
            }
          } catch (err) {
            console.error("[useRun] stream parse error:", err);
          }
        };
        es.onerror = () => {
          // SSE disconnected (Vercel timeout or network) — polling will take over
          if (es) { es.close(); es = null; }
        };

        // 2. DB polling as fallback (handles SSE timeouts on Vercel Hobby plan)
        pollInterval = setInterval(poll, 2000);

        // 3. POST to start execution
        const res = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowId, scope, targetNodeIds, runId: clientRunId }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("[useRun] run start failed:", res.status, text);
          cleanup();
          return;
        }

        console.log("[useRun] run started, runId:", clientRunId);
      } catch (err) {
        console.error("[useRun] error:", err);
        cleanup();
      }
    },
    [workflowId, isRunning, setIsRunning, setActiveRunId, setRunningIds, setNodeState, resetNodeStates, applyNodeResult]
  );

  return { running: isRunning, run, cancelRun };
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
  try { return JSON.stringify(output, null, 2); } catch { return String(output); }
}
