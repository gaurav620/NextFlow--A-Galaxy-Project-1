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
  nodeStates: Record<string, 'idle' | 'queued' | 'running' | 'success' | 'failed'>;
  isRunning: boolean;           // global running flag for UI
  activeRunId: string | null;   // currently running run ID (for cancel)
  runRequest: string | null;    // nodeId to run, or 'full' for all
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
  setNodeState: (id: string, state: 'idle' | 'queued' | 'running' | 'success' | 'failed') => void;
  setAllNodeStates: (states: Record<string, 'idle' | 'queued' | 'running' | 'success' | 'failed'>) => void;
  resetNodeStates: () => void;
  setIsRunning: (v: boolean) => void;
  setActiveRunId: (id: string | null) => void;
  requestRun: (nodeId?: string) => void;  // called from node Run buttons
  clearRunRequest: () => void;
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
        model: "Gemini 3.1 Pro",
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
  nodeStates: {},
  isRunning: false,
  activeRunId: null,
  runRequest: null,
  past: [],
  future: [],
  dirty: false,

  init: ({ workflowId, name, nodes, edges }) => {
    const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    set({ workflowId, name, nodes, edges, selectedIds, past: [], future: [], dirty: false, nodeStates: {} });
  },

  setName: (name) => set({ name, dirty: true }),

  onNodesChange: (changes) => {
    const filtered = changes.filter((c) => {
      if (c.type === "remove") {
        const n = get().nodes.find((x) => x.id === c.id);
        if (n && NON_DELETABLE.has(n.type as NodeKind)) return false;
      }
      return true;
    });
    const nextNodes = applyNodeChanges(filtered, get().nodes);
    const selectedIds = new Set(nextNodes.filter((n) => n.selected).map((n) => n.id));
    set({
      nodes: nextNodes,
      selectedIds,
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
      if (handleId.startsWith("image") || handleId === "Input Image" || handleId === "Output Image" || handleId === "Image (Vision)") stroke = "#f59e0b";
      else if (handleId.startsWith("video") || handleId === "Video") stroke = "#ef4444";
      else if (handleId.startsWith("audio") || handleId === "Audio") stroke = "#10b981";
      else if (handleId.startsWith("file") || handleId === "File") stroke = "#8b5cf6";
      else stroke = "#3b82f6"; // text = blue
    }
    // Determine unique targetHandle for the Response node to support multiple inputs
    let targetHandle = conn.targetHandle ?? undefined;
    if (conn.target === "response") {
      targetHandle = `result_${conn.source}_${conn.sourceHandle ?? "default"}`;
    }

    set({
      edges: [
        ...get().edges,
        {
          id,
          source: conn.source!,
          sourceHandle: conn.sourceHandle ?? undefined,
          target: conn.target!,
          targetHandle,
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

  setRunning: (ids) => {
    const nextRunning = new Set(ids);
    const nextStates = { ...get().nodeStates };
    // Set all matching to running and others to idle/queued as needed (for backwards compatibility)
    for (const id of get().nodes.map((n) => n.id)) {
      if (nextRunning.has(id)) {
        nextStates[id] = "running";
      } else if (nextStates[id] === "running") {
        nextStates[id] = "idle";
      }
    }
    set({ runningNodeIds: nextRunning, isRunning: ids.length > 0, nodeStates: nextStates });
  },
  markRunning: (id, running) => {
    const next = new Set(get().runningNodeIds);
    if (running) next.add(id);
    else next.delete(id);
    
    const nextStates = { ...get().nodeStates, [id]: (running ? "running" : "idle") as "running" | "idle" };
    set({ runningNodeIds: next, isRunning: next.size > 0, nodeStates: nextStates });
  },
  setNodeState: (id, state) => set((s) => {
    const nextStates = { ...s.nodeStates, [id]: state };
    const nextRunning = new Set(s.runningNodeIds);
    if (state === "running") nextRunning.add(id);
    else nextRunning.delete(id);
    return {
      nodeStates: nextStates,
      runningNodeIds: nextRunning,
      isRunning: nextRunning.size > 0,
    };
  }),
  setAllNodeStates: (states) => set((s) => {
    const nextRunning = new Set<string>();
    for (const [id, st] of Object.entries(states)) {
      if (st === "running") nextRunning.add(id);
    }
    return {
      nodeStates: states,
      runningNodeIds: nextRunning,
      isRunning: nextRunning.size > 0,
    };
  }),
  resetNodeStates: () => set({ nodeStates: {}, runningNodeIds: new Set(), isRunning: false }),
  setIsRunning: (v) => set({ isRunning: v }),
  setActiveRunId: (id) => set({ activeRunId: id }),
  requestRun: (nodeId) => set({ runRequest: nodeId ?? "full" }),
  clearRunRequest: () => set({ runRequest: null }),

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
    const selectedIds = new Set(prev.nodes.filter((n) => n.selected).map((n) => n.id));
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      selectedIds,
      past: past.slice(0, -1),
      future: [...future, { nodes, edges }],
      dirty: true,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const selectedIds = new Set(next.nodes.filter((n) => n.selected).map((n) => n.id));
    set({
      nodes: next.nodes,
      edges: next.edges,
      selectedIds,
      future: future.slice(0, -1),
      past: [...past, { nodes, edges }],
      dirty: true,
    });
  },

  clearDirty: () => set({ dirty: false }),

  loadGraph: (nodes, edges) => {
    const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    set({ nodes, edges, selectedIds, past: [], future: [], dirty: true, nodeStates: {} });
  },
}));
