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
      {/* Bottom center bar — Galaxy.ai style: premium glassmorphic pill */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-5 z-10 flex items-center gap-1 bg-zinc-950/80 border border-white/5 rounded-2xl px-2 py-1.5 shadow-2xl backdrop-blur-md">
        {/* Undo / Redo */}
        <ToolBtn onClick={undo} title="Undo (⌘Z)"><Undo2 size={14} /></ToolBtn>
        <ToolBtn onClick={redo} title="Redo (⌘⇧Z)"><Redo2 size={14} /></ToolBtn>

        <Separator />

        {/* Zoom */}
        <ToolBtn onClick={() => rf.zoomOut()} title="Zoom out"><ZoomOut size={14} /></ToolBtn>
        <button
          onClick={() => rf.zoomTo(1)}
          title="Reset zoom (click)"
          className="px-2 h-8 text-[11px] tabular-nums text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors font-medium min-w-[44px]"
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

        {/* + Add node — filled purple button */}
        <button
          onClick={() => setPickerOpen(true)}
          className="ml-0.5 w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
          title="Add node"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Bottom right: minimap toggle */}
      <button
        onClick={onToggleMinimap}
        className={`absolute right-4 bottom-5 z-10 p-2.5 rounded-lg border border-white/5 backdrop-blur-md transition-colors ${
          showMinimap 
            ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/20" 
            : "bg-zinc-950/80 hover:bg-white/10 text-zinc-400 hover:text-white"
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
      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-white/10 mx-0.5" />;
}
