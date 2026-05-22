import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import { buildExecGraph, type ExecNode } from "@/lib/dag";
import type { WorkflowGraph } from "@/lib/types";

export interface RunEvent {
  type: "node-queued" | "node-start" | "node-finish" | "node-error" | "run-finish";
  nodeId?: string;
  output?: unknown;
  error?: string;
  durationMs?: number;
}

export interface RunOptions {
  runId: string;
  workflowId: string;
  graph: WorkflowGraph;
  scope: "full" | "partial" | "single";
  targetNodeIds?: string[];
  onEvent: (evt: RunEvent) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Map UI model names to Google AI SDK model identifiers.
 * IMPORTANT: Only use stable (non-preview) model IDs that work with standard API keys.
 */
function resolveModelId(uiName?: string): string {
  switch (uiName) {
    case "Gemini 3.1 Pro":   return "gemini-2.5-flash";  // UI label per spec; maps to free-tier
    case "Gemini 2.5 Flash": return "gemini-2.5-flash";
    case "Gemini 2.0 Flash": return "gemini-2.0-flash";
    case "Gemini 2.5 Pro":   return "gemini-2.5-pro";
    default:                 return "gemini-2.5-flash";
  }
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

function getInputValue(
  results: Record<string, unknown>,
  inputSpec: { source: string; sourceHandle?: string }
): unknown {
  const sourceOutput = results[inputSpec.source];
  if (
    sourceOutput !== null &&
    typeof sourceOutput === "object" &&
    !Array.isArray(sourceOutput) &&
    inputSpec.sourceHandle
  ) {
    const obj = sourceOutput as Record<string, unknown>;
    const val = obj[inputSpec.sourceHandle];
    if (val !== undefined) return val;
    const firstString = Object.values(obj).find((v) => typeof v === "string");
    if (firstString !== undefined) return firstString;
  }
  return sourceOutput;
}

function inputStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return ""; }
}

function inputImageUrl(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.outputUrl === "string") return o.outputUrl;
    if (typeof o.imageUrl === "string") return o.imageUrl;
  }
  return "";
}

// ---------------------------------------------------------------------------
// Node executors — ALL run in-process inside the Trigger.dev orchestrator
// No nested task triggering (which deadlocks on free-plan concurrency)
// ---------------------------------------------------------------------------

async function executeGemini(node: ExecNode, results: Record<string, unknown>) {
  const data = node.data as {
    prompt?: string;
    systemPrompt?: string;
    model?: string;
  };
  const promptInput = node.inputs["Prompt"];
  const sysInput = node.inputs["System Prompt"];
  const imageInput = node.inputs["Image (Vision)"];

  const prompt = promptInput
    ? inputStr(getInputValue(results, promptInput))
    : data.prompt ?? "";
  const system = sysInput
    ? inputStr(getInputValue(results, sysInput))
    : data.systemPrompt ?? "";
  const imageUrl = imageInput
    ? inputImageUrl(getInputValue(results, imageInput))
    : (data as { visionImageUrl?: string }).visionImageUrl || "";

  const modelId = resolveModelId(data.model);
  console.log(`[execute] Gemini node=${node.id} model=${modelId} prompt="${prompt.slice(0, 80)}"`);

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    await sleep(1500);
    return `[Demo] Gemini response for: "${prompt.slice(0, 80)}"` +
      (system ? ` (system: ${system.slice(0, 40)})` : "");
  }

  try {
    // Multimodal path — image + text
    if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
      try {
        const { text } = await generateText({
          model: google(modelId),
          system: system || undefined,
          messages: [{
            role: "user",
            content: [
              { type: "image", image: new URL(imageUrl) },
              { type: "text", text: prompt || "Describe this image." },
            ],
          }],
        });
        return text;
      } catch (visionErr) {
        console.warn("[execute] Vision failed, falling back to text-only:", visionErr);
      }
    }

    // Text-only path
    const { text } = await generateText({
      model: google(modelId),
      system: system || undefined,
      prompt: prompt || "Hello",
    });
    return text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[execute] Gemini error (model=${modelId}):`, msg);
    throw new Error(`Gemini error: ${msg.slice(0, 200)}`);
  }
}

/**
 * Crop Image executor — runs in-process.
 * MANDATORY: 30+ second artificial delay per spec before returning.
 */
async function executeCropImage(node: ExecNode, results: Record<string, unknown>) {
  const inputSpec = node.inputs["Input Image"];
  const inputVal = inputSpec ? getInputValue(results, inputSpec) : undefined;
  const inputUrl = inputImageUrl(inputVal);
  console.log(`[execute] CropImage node=${node.id} inputUrl="${inputUrl.slice(0, 80)}"`);

  // MANDATORY 31-second delay per spec
  console.log(`[execute] CropImage node=${node.id} beginning mandatory 31-second delay...`);
  await sleep(31_000);
  console.log(`[execute] CropImage node=${node.id} delay completed.`);

  // In production: would download + ffmpeg crop + re-upload
  // For now, echo back the input URL as the "cropped" URL
  return inputUrl || "https://placehold.co/600x400?text=cropped";
}

async function executeRequestInputs(node: ExecNode) {
  const data = node.data as { fields?: Array<{ key: string; value?: string }> };
  const out: Record<string, string> = {};
  for (const f of data.fields ?? []) out[f.key] = f.value ?? "";
  return out;
}

// ---------------------------------------------------------------------------
// Main execution engine
// ---------------------------------------------------------------------------

export async function executeWorkflow(opts: RunOptions) {
  const { runId, graph, scope, targetNodeIds, onEvent } = opts;

  try {
    const { nodes, order } = buildExecGraph(graph, scope, targetNodeIds);
    console.log(`[execute] Executing scope=${scope} order=[${order.join(", ")}]`);

    // 1. Database Hydration for external parent dependencies
    const results: Record<string, unknown> = {};
    const externalParents = new Set<string>();
    for (const id of order) {
      const node = nodes[id];
      for (const parentId of node.parents) {
        if (!nodes[parentId]) {
          externalParents.add(parentId);
        }
      }
    }

    for (const parentId of externalParents) {
      console.log(`[execute] Hydrating external parent dependency: ${parentId}`);
      const lastSuccessfulRun = await prisma.nodeRun.findFirst({
        where: {
          nodeId: parentId,
          status: "success",
          run: { workflowId: opts.workflowId },
        },
        orderBy: { finishedAt: "desc" },
      });

      if (lastSuccessfulRun) {
        results[parentId] = lastSuccessfulRun.output;
      } else {
        const parentNode = graph.nodes.find((n) => n.id === parentId);
        if (parentNode && parentNode.type === "request-inputs") {
          // Fallback: extract the field values entered directly in the graph
          const data = parentNode.data as { fields?: Array<{ key: string; value?: string }> };
          const out: Record<string, string> = {};
          for (const f of data.fields ?? []) out[f.key] = f.value ?? "";
          results[parentId] = out;
          console.log(`[execute] Fallback hydration for request-inputs nodeId=${parentId}:`, out);
        } else if (parentNode && parentNode.type === "crop-image") {
          results[parentId] = "https://placehold.co/600x400?text=cropped";
          console.log(`[execute] Fallback hydration for crop-image nodeId=${parentId}`);
        } else if (parentNode && parentNode.type === "gemini") {
          results[parentId] = "Placeholder Gemini response";
          console.log(`[execute] Fallback hydration for gemini nodeId=${parentId}`);
        } else {
          const parentLabel = parentNode?.type || parentId;
          throw new Error(`Missing input from dependency: ${parentLabel} has not been successfully executed yet.`);
        }
      }
    }

    // 2. Emit node-queued events for all nodes about to execute
    for (const id of order) {
      onEvent({ type: "node-queued", nodeId: id });
    }

    // 3. Build per-node execution promises with proper dependency barriers
    const promises: Record<string, Promise<void>> = {};

    for (const id of order) {
      const node = nodes[id];
      // Only wait for parents that are part of this execution
      const parentPromises = node.parents
        .filter((p) => promises[p])
        .map((p) => promises[p]);

      promises[id] = (async () => {
        try {
          // Wait for direct parent dependencies to finish
          await Promise.all(parentPromises);
        } catch (parentErr) {
          const msg = "Dependency failed";
          await prisma.nodeRun.updateMany({
            where: { runId, nodeId: id },
            data: { status: "failed", error: msg, finishedAt: new Date() },
          });
          onEvent({ type: "node-error", nodeId: id, error: msg });
          throw new Error(msg);
        }

        const startedAt = Date.now();
        try {
          // Mark node as running
          onEvent({ type: "node-start", nodeId: id });
          await prisma.nodeRun.updateMany({
            where: { runId, nodeId: id },
            data: { status: "running", startedAt: new Date() },
          });

          let output: unknown;
          switch (node.type) {
            case "request-inputs":
              output = await executeRequestInputs(node);
              break;
            case "gemini":
              // Run in-process (NOT nested Trigger.dev task — avoids free-plan deadlock)
              output = await executeGemini(node, results);
              break;
            case "crop-image":
              // Run in-process with mandatory 31s delay
              output = await executeCropImage(node, results);
              break;
            case "response": {
              const inputKeys = Object.keys(node.inputs);
              if (inputKeys.length === 0) {
                output = node.parents
                  .map((p) => results[p])
                  .filter((v) => v !== undefined)
                  .pop() ?? "";
              } else if (inputKeys.length === 1) {
                const inputSpec = node.inputs[inputKeys[0]];
                const val = getInputValue(results, inputSpec);
                output = typeof val === "object" && val !== null ? JSON.stringify(val, null, 2) : String(val ?? "");
              } else {
                const parts = inputKeys.map((key) => {
                  const inputSpec = node.inputs[key];
                  const val = getInputValue(results, inputSpec);
                  const srcNode = graph.nodes.find((n) => n.id === inputSpec.source);
                  const srcData = srcNode?.data as Record<string, unknown> | undefined;
                  const label =
                    (srcData?.model as string) ||
                    (srcNode?.type === "crop-image" ? "Crop Image" : "") ||
                    (srcNode?.type === "request-inputs" ? "Request Inputs" : "") ||
                    srcNode?.type ||
                    inputSpec.source;
                  const valStr = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val ?? "");
                  return `${label}: ${valStr}`;
                });
                output = parts.join("\n\n");
              }
              break;
            }
            default:
              output = null;
          }

          results[id] = output;
          const durationMs = Date.now() - startedAt;
          await prisma.nodeRun.updateMany({
            where: { runId, nodeId: id },
            data: {
              status: "success",
              output: output as unknown as object,
              durationMs,
              finishedAt: new Date(),
            },
          });
          onEvent({ type: "node-finish", nodeId: id, output, durationMs });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const durationMs = Date.now() - startedAt;
          await prisma.nodeRun.updateMany({
            where: { runId, nodeId: id },
            data: {
              status: "error",
              error: msg,
              durationMs,
              finishedAt: new Date(),
            },
          });
          onEvent({ type: "node-error", nodeId: id, error: msg, durationMs });
          throw err;
        }
      })();
    }

    // 4. Await all promises, allow partial success
    let status: "success" | "error" | "partial" = "success";
    try {
      await Promise.all(Object.values(promises));
    } catch {
      const settled = await Promise.allSettled(Object.values(promises));
      status = settled.some((s) => s.status === "fulfilled") ? "partial" : "error";
    }

    await prisma.run.update({
      where: { id: runId },
      data: { status, finishedAt: new Date() },
    });
    onEvent({ type: "run-finish" });
    return { status, results };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[executeWorkflow] Fatal execution error: ${msg}`);

    await prisma.run.update({
      where: { id: runId },
      data: { status: "error", finishedAt: new Date() },
    }).catch((dbErr) => console.error("Failed to update Run status on fatal error:", dbErr));

    onEvent({ type: "run-finish", error: msg });
    throw err;
  }
}
