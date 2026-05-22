import type { WorkflowGraph } from "@/lib/types";

export interface ExecNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  parents: string[];
  inputs: Record<string, { source: string; sourceHandle?: string }>;
}

export function buildExecGraph(
  graph: WorkflowGraph,
  scope: "full" | "partial" | "single",
  targetNodeIds?: string[]
): { nodes: Record<string, ExecNode>; order: string[] } {
  const nodes: Record<string, ExecNode> = {};
  for (const n of graph.nodes) {
    nodes[n.id] = {
      id: n.id,
      type: n.type,
      data: n.data,
      parents: [],
      inputs: {},
    };
  }
  for (const e of graph.edges) {
    if (nodes[e.target]) {
      if (e.targetHandle) {
        nodes[e.target].inputs[e.targetHandle] = {
          source: e.source,
          sourceHandle: e.sourceHandle,
        };
      }
      if (!nodes[e.target].parents.includes(e.source)) {
        nodes[e.target].parents.push(e.source);
      }
    }
  }

  // Topological order via Kahn's algorithm
  const indeg: Record<string, number> = {};
  for (const id of Object.keys(nodes)) indeg[id] = nodes[id].parents.length;
  const ready: string[] = Object.keys(indeg).filter((id) => indeg[id] === 0);
  const out: string[] = [];
  const adj: Record<string, string[]> = {};
  for (const e of graph.edges) {
    (adj[e.source] ??= []).push(e.target);
  }
  while (ready.length) {
    const id = ready.shift()!;
    out.push(id);
    for (const t of adj[id] ?? []) {
      if (indeg[t] !== undefined) {
        indeg[t] -= 1;
        if (indeg[t] === 0) ready.push(t);
      }
    }
  }

  if (out.length < Object.keys(nodes).length) {
    throw new Error("Cycle detected in workflow graph. Execution aborted.");
  }

  // Restrict to scope
  if (scope !== "full" && targetNodeIds?.length) {
    const set = new Set(targetNodeIds);
    return {
      nodes: Object.fromEntries(out.filter((id) => set.has(id)).map((id) => [id, nodes[id]])),
      order: out.filter((id) => set.has(id)),
    };
  }

  return { nodes, order: out };
}
