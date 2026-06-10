import { useCanvas } from "@/stores/canvas";
import type { FlowNode, FlowEdge } from "@/stores/canvas";

/**
 * Export the current workflow graph as a JSON file download.
 */
export function exportWorkflowJson() {
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
}

/**
 * Import a workflow JSON file, validate with Zod, and load into canvas.
 */
export async function importWorkflowJson(setName: (name: string) => void) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "application/json";
  inp.onchange = async () => {
    const file = inp.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const { WorkflowGraphSchema } = await import("@/lib/types");
      const result = WorkflowGraphSchema.safeParse(raw);
      if (!result.success) {
        const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
        alert(`Invalid workflow file:\n${issues}`);
        return;
      }
      useCanvas.getState().loadGraph(result.data.nodes as FlowNode[], result.data.edges as FlowEdge[]);
      if (raw.name) setName(raw.name);
    } catch {
      alert("Invalid workflow file — could not parse JSON");
    }
  };
  inp.click();
}
