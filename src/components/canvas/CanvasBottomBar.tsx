"use client";

import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  Plus,
  Map as MapIcon,
  Workflow,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useState } from "react";
import { useCanvas, type FlowNode, type FlowEdge } from "@/stores/canvas";
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
  const [zoom, setZoom] = useState(100);

  const recalcZoom = () => {
    try {
      setZoom(Math.round(rf.getZoom() * 100));
    } catch {
      // ignore
    }
  };

  const autoLayout = () => {
    const nodes = useCanvas.getState().nodes;
    const edges = useCanvas.getState().edges;
    if (nodes.length === 0) return;

    // Build adjacency + in-degree for BFS layering
    const adj: Record<string, string[]> = {};
    const indeg: Record<string, number> = {};
    nodes.forEach((n) => { adj[n.id] = []; indeg[n.id] = 0; });
    edges.forEach((e) => {
      adj[e.source]?.push(e.target);
      indeg[e.target] = (indeg[e.target] ?? 0) + 1;
    });

    // BFS layering
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
    // Add any remaining unvisited nodes
    const remaining = nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
    if (remaining.length) layers.push(remaining);

    // Position: X based on layer, Y spread within each layer
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

  return (
    <>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 nf-card px-1.5 py-1.5 flex items-center gap-0.5 z-10">
        <ToolBtn onClick={undo} title="Undo (⌘Z)"><Undo2 size={15} /></ToolBtn>
        <ToolBtn onClick={redo} title="Redo (⌘⇧Z)"><Redo2 size={15} /></ToolBtn>
        <div className="w-px h-5 bg-neutral-200 mx-0.5" />
        <ToolBtn
          onClick={() => { rf.zoomOut(); recalcZoom(); }}
          title="Zoom out"
        >
          <ZoomOut size={15} />
        </ToolBtn>
        <span className="text-xs text-neutral-600 px-1.5 w-10 text-center">{zoom}%</span>
        <ToolBtn
          onClick={() => { rf.zoomIn(); recalcZoom(); }}
          title="Zoom in"
        >
          <ZoomIn size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => { rf.fitView({ padding: 0.2 }); recalcZoom(); }}
          title="Fit view"
        >
          <Maximize size={15} />
        </ToolBtn>
        <ToolBtn onClick={onToggleMinimap} title="Toggle minimap" active={showMinimap}>
          <LayoutGrid size={15} />
        </ToolBtn>
        <ToolBtn onClick={autoLayout} title="Auto layout">
          <Workflow size={15} />
        </ToolBtn>
        <div className="w-px h-5 bg-neutral-200 mx-0.5" />
        <button
          onClick={() => setPickerOpen(true)}
          className="ml-0.5 inline-flex items-center justify-center w-8 h-8 rounded-md bg-neutral-900 text-white hover:bg-neutral-800"
          title="Add node"
        >
          <Plus size={16} />
        </button>
      </div>

      <button
        onClick={onToggleMinimap}
        className="absolute right-4 bottom-4 z-10 p-2 rounded-md bg-white border border-neutral-200 hover:bg-neutral-50"
        title="Minimap"
      >
        <MapIcon size={15} />
      </button>

      <NodePicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}

function ToolBtn({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md hover:bg-neutral-100 ${active ? "bg-neutral-100" : ""}`}
    >
      {children}
    </button>
  );
}
