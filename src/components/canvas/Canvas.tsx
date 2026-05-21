"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type IsValidConnection,
} from "@xyflow/react";
import { useCanvas, type FlowNode, type FlowEdge } from "@/stores/canvas";
import { HANDLE_COLORS } from "@/lib/types";
import type { WorkflowGraph, NodeKind } from "@/lib/types";
import { RequestInputsNode } from "@/components/nodes/RequestInputsNode";
import { CropImageNode } from "@/components/nodes/CropImageNode";
import { GeminiNode } from "@/components/nodes/GeminiNode";
import { ResponseNode } from "@/components/nodes/ResponseNode";
import { CanvasTopBar } from "@/components/canvas/CanvasTopBar";
import { CanvasBottomBar } from "@/components/canvas/CanvasBottomBar";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { useRun } from "@/lib/use-run";

const nodeTypes = {
  "request-inputs": RequestInputsNode,
  "crop-image": CropImageNode,
  gemini: GeminiNode,
  response: ResponseNode,
} as const;

interface Props {
  workflowId: string;
  name: string;
  graph: WorkflowGraph;
}

function handleTypeFor(nodeKind: NodeKind, handleId: string | undefined): string {
  if (!handleId) return "any";
  if (handleId.startsWith("image") || handleId === "vision" || handleId === "Input Image" || handleId === "Output Image" || handleId === "Image (Vision)") return "image";
  if (handleId.startsWith("video") || handleId === "Video") return "video";
  if (handleId.startsWith("audio") || handleId === "Audio") return "audio";
  if (handleId.startsWith("file") || handleId === "File") return "file";
  return "text";
}

/** Return edge stroke color based on the source handle type */
export function edgeColorForHandle(sourceHandle?: string): string {
  const ht = handleTypeFor("gemini" as NodeKind, sourceHandle);
  return HANDLE_COLORS[ht as keyof typeof HANDLE_COLORS] ?? "#7c3aed";
}

function CanvasInner({ workflowId, name: initialName, graph }: Props) {
  const init = useCanvas((s) => s.init);
  const nodes = useCanvas((s) => s.nodes);
  const edges = useCanvas((s) => s.edges);
  const dirty = useCanvas((s) => s.dirty);
  const name = useCanvas((s) => s.name);
  const onNodesChange = useCanvas((s) => s.onNodesChange);
  const onEdgesChange = useCanvas((s) => s.onEdgesChange);
  const onConnect = useCanvas((s) => s.onConnect);
  const clearDirty = useCanvas((s) => s.clearDirty);
  const undo = useCanvas((s) => s.undo);
  const redo = useCanvas((s) => s.redo);
  const clearRunRequest = useCanvas((s) => s.clearRunRequest);
  const runRequest = useCanvas((s) => s.runRequest);
  const { run } = useRun(workflowId);

  const [showMinimap, setShowMinimap] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for run requests from individual node Run buttons
  useEffect(() => {
    if (!runRequest) return;
    clearRunRequest();
    // 'full' means run all, otherwise it's a nodeId for partial run
    run(runRequest === "full" ? "full" : "full"); // always full for now
  }, [runRequest, clearRunRequest, run]);

  useEffect(() => {
    const nodesIn: FlowNode[] = graph.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data as Record<string, unknown>,
      deletable: n.type !== "request-inputs" && n.type !== "response",
    }));
    const edgesIn = graph.edges.map((e) => {
      let targetHandle = e.targetHandle;
      if (e.target === "response" && (!targetHandle || targetHandle === "result")) {
        targetHandle = `result_${e.source}_${e.sourceHandle ?? "default"}`;
      }
      return {
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle,
        animated: true,
        style: { stroke: edgeColorForHandle(e.sourceHandle), strokeWidth: 2 },
      };
    }) as FlowEdge[];
    init({ workflowId, name: initialName, nodes: nodesIn, edges: edgesIn });
  }, [workflowId, initialName, graph, init]);

  // Debounced autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const body = {
        name,
        graph: {
          version: 1 as const,
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type as NodeKind,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            sourceHandle: e.sourceHandle ?? undefined,
            target: e.target,
            targetHandle: e.targetHandle ?? undefined,
          })),
        },
      };
      try {
        await fetch(`/api/workflows/${workflowId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        clearDirty();
      } catch {
        // network errors swallowed; will retry on next change
      }
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dirty, nodes, edges, name, workflowId, clearDirty]);

  // Keyboard shortcuts: undo/redo + fit-view (F) + delete guard
  const rfInstance = useReactFlow();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && ((e.key === "z" && e.shiftKey) || e.key === "y")) { e.preventDefault(); redo(); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); rfInstance.fitView({ padding: 0.2 }); }
      else if (e.key === "Backspace" || e.key === "Delete") {
        const selected = nodes.filter((n) => n.selected);
        const guarded = selected.filter(
          (n) => n.type === "request-inputs" || n.type === "response"
        );
        if (guarded.length > 0 && selected.length === guarded.length) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [undo, redo, rfInstance, nodes]);

  const isValidConnection = useCallback<IsValidConnection>((conn) => {
    const c = conn as Connection;
    if (!c.source || !c.target) return false;
    if (c.source === c.target) return false;
    const srcNode = nodes.find((n) => n.id === c.source);
    const tgtNode = nodes.find((n) => n.id === c.target);
    if (!srcNode || !tgtNode) return false;
    const srcType = handleTypeFor(srcNode.type as NodeKind, c.sourceHandle ?? undefined);
    const tgtType = handleTypeFor(tgtNode.type as NodeKind, c.targetHandle ?? undefined);
    if (srcType !== "any" && tgtType !== "any" && srcType !== tgtType) return false;
    // DAG cycle check
    const adj = new Map<string, string[]>();
    for (const e of edges) {
      if (!adj.has(e.source)) adj.set(e.source, []);
      adj.get(e.source)!.push(e.target);
    }
    const stack = [c.target];
    const seen = new Set<string>();
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur === c.source) return false;
      if (seen.has(cur)) continue;
      seen.add(cur);
      const out = adj.get(cur) ?? [];
      stack.push(...out);
    }
    return true;
  }, [nodes, edges]);

  const memoNodeTypes = useMemo(() => nodeTypes, []);

  return (
    // Full screen: flex row (sidebar + main)
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f7f8]">
      {/* Left sidebar */}
      <CanvasSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main column: top bar + canvas */}
      <div className="flex flex-col flex-1 min-w-0">
        <CanvasTopBar
          workflowId={workflowId}
          onToggleHistory={() => setShowHistory((v) => !v)}
        />

        {/* Canvas area */}
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={memoNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2.5}
            deleteKeyCode={["Backspace", "Delete"]}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ animated: true, style: { strokeWidth: 2 } }}
            connectionLineStyle={{ stroke: "#7c3aed", strokeWidth: 2, strokeDasharray: "5 5" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.2}
              color="#d1d5db"
            />
            <Controls
              position="bottom-left"
              showInteractive={false}
              style={{ boxShadow: "none", border: "1px solid #e5e7eb", borderRadius: 8, background: "white" }}
            />
            {showMinimap && (
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                maskColor="rgba(244,244,245,0.7)"
                style={{ borderRadius: 10, border: "1px solid #e4e4e7", marginBottom: 60 }}
              />
            )}
          </ReactFlow>

          <CanvasBottomBar
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap((v) => !v)}
          />

          <HistoryPanel
            workflowId={workflowId}
            open={showHistory}
            onClose={() => setShowHistory(false)}
          />
        </div>
      </div>
    </div>
  );
}

export function Canvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
