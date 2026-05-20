"use client";

import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import type { NodeData, NodeKind } from "@/lib/types";

export type FlowNode = Node;
export type FlowEdge = Edge;

interface HistoryEntry {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface CanvasState {
  workflowId: string | null;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedIds: Set<string>;
  runningNodeIds: Set<string>;
  past: HistoryEntry[];
  future: HistoryEntry[];
  dirty: boolean;

  init: (params: {
    workflowId: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  }) => void;
  setName: (name: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  addNode: (kind: NodeKind, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  setRunning: (ids: string[]) => void;
  markRunning: (id: string, running: boolean) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearDirty: () => void;
  loadGraph: (nodes: FlowNode[], edges: FlowEdge[]) => void;
}

const NON_DELETABLE = new Set(["request-inputs", "response"]);

function freshId(prefix = "n") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultDataFor(kind: NodeKind): NodeData {
  switch (kind) {
    case "crop-image":
      return { x: 0, y: 0, w: 100, h: 100 };
    case "gemini":
      return {
        model: "Gemini 2.5 Flash",
        prompt: "",
        systemPrompt: "",
        images: [],
      };
    case "request-inputs":
      return { fields: [] };
    case "response":
      return {};
  }
}

export const useCanvas = create<CanvasState>((set, get) => ({
  workflowId: null,
  name: "Untitled",
  nodes: [],
  edges: [],
  selectedIds: new Set(),
  runningNodeIds: new Set(),
  past: [],
  future: [],
  dirty: false,

  init: ({ workflowId, name, nodes, edges }) =>
    set({ workflowId, name, nodes, edges, past: [], future: [], dirty: false }),

  setName: (name) => set({ name, dirty: true }),

  onNodesChange: (changes) => {
    const filtered = changes.filter((c) => {
      if (c.type === "remove") {
        const n = get().nodes.find((x) => x.id === c.id);
        if (n && NON_DELETABLE.has(n.type as NodeKind)) return false;
      }
      return true;
    });
    set({
      nodes: applyNodeChanges(filtered, get().nodes),
      dirty: true,
    });
  },

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges), dirty: true }),

  onConnect: (conn) => {
    get().pushHistory();
    const id = freshId("e");
    // Determine edge color from the source handle type
    const handleId = conn.sourceHandle ?? undefined;
    let stroke = "#7c3aed"; // default purple
    if (handleId) {
      if (handleId.startsWith("image") || handleId === "Input Image" || handleId === "Output Image") stroke = "#f59e0b";
      else if (handleId.startsWith("video")) stroke = "#ef4444";
      else if (handleId.startsWith("audio")) stroke = "#10b981";
      else if (handleId.startsWith("file")) stroke = "#8b5cf6";
      else stroke = "#3b82f6"; // text = blue
    }
    set({
      edges: [
        ...get().edges,
        {
          id,
          source: conn.source!,
          sourceHandle: conn.sourceHandle ?? undefined,
          target: conn.target!,
          targetHandle: conn.targetHandle ?? undefined,
          animated: true,
          style: { stroke, strokeWidth: 2 },
        },
      ],
      dirty: true,
    });
  },

  addNode: (kind, position) => {
    get().pushHistory();
    const id = freshId(kind);
    const node: FlowNode = {
      id,
      type: kind,
      position,
      data: defaultDataFor(kind),
    };
    set({ nodes: [...get().nodes, node], dirty: true });
  },

  updateNodeData: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      ),
      dirty: true,
    });
  },

  setRunning: (ids) => set({ runningNodeIds: new Set(ids) }),
  markRunning: (id, running) => {
    const next = new Set(get().runningNodeIds);
    if (running) next.add(id);
    else next.delete(id);
    set({ runningNodeIds: next });
  },

  pushHistory: () => {
    const { nodes, edges, past } = get();
    set({
      past: [...past.slice(-49), { nodes, edges }],
      future: [],
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [...future, { nodes, edges }],
      dirty: true,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(0, -1),
      past: [...past, { nodes, edges }],
      dirty: true,
    });
  },

  clearDirty: () => set({ dirty: false }),

  loadGraph: (nodes, edges) =>
    set({ nodes, edges, past: [], future: [], dirty: true }),
}));
