"use client";

import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  Map as MapIcon,
  Workflow,
  FileJson2,
} from "lucide-react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useState } from "react";
import { useCanvas, type FlowNode } from "@/stores/canvas";
import { NodePicker } from "@/components/canvas/NodePicker";

interface Props {
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

export function CanvasBottomBar({ showMinimap, onToggleMinimap }: Props) {
  const rf = useReactFlow();
  const undo = useCanvas((s) => s.undo);
  const redo = useCanvas((s) => s.redo);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { zoom } = useViewport();

  const autoLayout = () => {
    const nodes = useCanvas.getState().nodes;
    const edges = useCanvas.getState().edges;
    if (nodes.length === 0) return;

    const adj: Record<string, string[]> = {};
    const indeg: Record<string, number> = {};
    nodes.forEach((n) => { adj[n.id] = []; indeg[n.id] = 0; });
    edges.forEach((e) => {
      adj[e.source]?.push(e.target);
      indeg[e.target] = (indeg[e.target] ?? 0) + 1;
    });

    const layers: string[][] = [];
    let queue = nodes.filter((n) => (indeg[n.id] ?? 0) === 0).map((n) => n.id);
    const visited = new Set<string>();
    while (queue.length > 0) {
      layers.push(queue);
      queue.forEach((id) => visited.add(id));
      const next: string[] = [];
      for (const id of queue) {
        for (const child of (adj[id] ?? [])) {
          indeg[child]--;
          if (indeg[child] === 0 && !visited.has(child)) next.push(child);
        }
      }
      queue = next;
    }
    const remaining = nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
    if (remaining.length) layers.push(remaining);

    const nodeWidth = 320;
    const nodeHeight = 120;
    const gapX = 100;
    const gapY = 60;
    const positions: Record<string, { x: number; y: number }> = {};
    layers.forEach((layer, li) => {
      const totalHeight = layer.length * nodeHeight + (layer.length - 1) * gapY;
      const startY = -totalHeight / 2;
      layer.forEach((id, yi) => {
        positions[id] = {
          x: li * (nodeWidth + gapX) + 80,
          y: startY + yi * (nodeHeight + gapY) + 240,
        };
      });
    });

    const updated = nodes.map((n) => ({
      ...n,
      position: positions[n.id] ?? n.position,
    })) as FlowNode[];
    useCanvas.getState().pushHistory();
    useCanvas.setState({ nodes: updated, dirty: true });
    setTimeout(() => rf.fitView({ padding: 0.2 }), 50);
  };

  const exportJson = () => {
    const state = useCanvas.getState();
    const blob = new Blob(
      [JSON.stringify({ version: 1, name: state.name, nodes: state.nodes, edges: state.edges }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.name || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      {/* Bottom center bar — Magica style: minimal floating pill */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-5 z-10 flex items-center gap-1 bg-white border border-neutral-200 rounded-xl px-1.5 py-1.5 shadow-sm">
        {/* Undo / Redo */}
        <ToolBtn onClick={undo} title="Undo (⌘Z)"><Undo2 size={14} /></ToolBtn>
        <ToolBtn onClick={redo} title="Redo (⌘⇧Z)"><Redo2 size={14} /></ToolBtn>

        <Separator />

        {/* Zoom */}
        <ToolBtn onClick={() => rf.zoomOut()} title="Zoom out"><ZoomOut size={14} /></ToolBtn>
        <button
          onClick={() => rf.zoomTo(1)}
          title="Reset zoom (click)"
          className="px-2 h-8 text-[11px] tabular-nums text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 rounded-md transition-colors font-medium min-w-[44px]"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolBtn onClick={() => rf.fitView({ padding: 0.2 })} title="Fit view"><Maximize size={14} /></ToolBtn>
        <ToolBtn onClick={() => rf.zoomIn()} title="Zoom in"><ZoomIn size={14} /></ToolBtn>

        <Separator />

        {/* Auto layout */}
        <ToolBtn onClick={autoLayout} title="Auto layout"><Workflow size={14} /></ToolBtn>

        <Separator />

        {/* Export JSON */}
        <ToolBtn onClick={exportJson} title="Export JSON">
          <FileJson2 size={14} />
        </ToolBtn>

        {/* + Add node — filled button */}
        <button
          onClick={() => setPickerOpen(true)}
          className="ml-0.5 w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
          title="Add node"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Bottom right: minimap toggle */}
      <button
        onClick={onToggleMinimap}
        className={`absolute right-4 bottom-5 z-10 p-2 rounded-lg border border-neutral-200 transition-colors ${
          showMinimap ? "bg-neutral-900 text-white border-neutral-900" : "bg-white hover:bg-neutral-50 text-neutral-500"
        }`}
        title="Toggle minimap"
      >
        <MapIcon size={14} />
      </button>

      <NodePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}

function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-neutral-100 mx-0.5" />;
}
