import { task } from "@trigger.dev/sdk";
import { z } from "zod";
import { WorkflowGraphSchema } from "@/lib/types";
import { executeWorkflow } from "@/lib/execute";

const Payload = z.object({
  runId: z.string(),
  workflowId: z.string(),
  graph: WorkflowGraphSchema,
  scope: z.enum(["full", "partial", "single"]),
  targetNodeIds: z.array(z.string()).optional(),
});

export const workflowOrchestratorTask = task({
  id: "workflow-orchestrator",
  maxDuration: 900, // 15 minutes — CropImage runs in-process with 31s delay per node
  retry: {
    maxAttempts: 1, // Do not auto-retry the entire workflow orchestrator itself to prevent duplicate runs
  },
  run: async (raw: unknown) => {
    console.log("[workflow-orchestrator] Received execution payload:", JSON.stringify(raw));
    const parsed = Payload.parse(raw);
    const { runId, workflowId, graph, scope, targetNodeIds } = parsed;

    console.log(`[workflow-orchestrator] Starting workflow run. id=${runId}, workflowId=${workflowId}, scope=${scope}`);

    try {
      const result = await executeWorkflow({
        runId,
        workflowId,
        graph: graph as any, // Cast to match expected graph types
        scope,
        targetNodeIds,
        onEvent: (evt) => {
          // Log orchestrator event transitions for tracking and cloud debugging
          console.log(`[workflow-orchestrator] Run event: [${evt.type}] nodeId=${evt.nodeId ?? "N/A"}`);
        },
      });

      console.log(`[workflow-orchestrator] Workflow run completed successfully. status=${result.status}`);
      return { status: result.status, completedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[workflow-orchestrator] Workflow execution failed. error="${errMsg}"`);
      throw err; // Propagate to let Trigger.dev set run status as FAILED
    }
  },
});
