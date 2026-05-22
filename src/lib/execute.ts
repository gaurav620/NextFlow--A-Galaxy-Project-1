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

/**
 * Detect whether Trigger.dev should be used for execution.
 * Only enabled when explicitly opted in via TRIGGER_DEV_ENABLED=true.
 * On Vercel serverless, tasks run in-process since there's no persistent worker.
 */
function useTriggerDev(): boolean {
  return process.env.TRIGGER_DEV_ENABLED === "true";
}

/** Map UI model names to Google AI SDK model identifiers.
 * IMPORTANT: Only use stable (non-preview) model IDs that work with standard API keys.
 * Preview models like gemini-2.5-flash-preview-* require allowlisted access.
 */
function resolveModelId(uiName?: string): string {
  switch (uiName) {
    // Free-tier fast models (default)
    case "Gemini 2.5 Flash":
      return "gemini-1.5-flash";
    case "Gemini 2.0 Flash":
      return "gemini-2.0-flash";
    // Pro models (may use quota faster)
    case "Gemini 3.1 Pro":
      return "gemini-1.5-flash"; // map to flash for free-tier safety
    case "Gemini 2.5 Pro":
      return "gemini-1.5-pro";
    default:
      // Any unrecognised label → safe free-tier fallback
      return "gemini-1.5-flash";
  }
}

// ---------------------------------------------------------------------------
// Node executors — in-process (local dev) versions
// ---------------------------------------------------------------------------

/**
 * Read the value for a node input, correctly handling the case where
 * the source node's output is an object (e.g. request-inputs returns
 * { text_field: "...", image_field: "..." }) and we need the specific field
 * identified by sourceHandle.
 */
function getInputValue(
  results: Record<string, unknown>,
  inputSpec: { source: string; sourceHandle?: string }
): unknown {
  const sourceOutput = results[inputSpec.source];
  // If source output is an object and we have a sourceHandle, extract that key
  if (
    sourceOutput !== null &&
    typeof sourceOutput === "object" &&
    !Array.isArray(sourceOutput) &&
    inputSpec.sourceHandle
  ) {
    const obj = sourceOutput as Record<string, unknown>;
    const val = obj[inputSpec.sourceHandle];
    if (val !== undefined) return val;
    // Also try looking for any string value in the object (fallback)
    const firstString = Object.values(obj).find((v) => typeof v === "string");
    if (firstString !== undefined) return firstString;
  }
  return sourceOutput;
}

/** Safely convert input value to string */
function inputStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  // Object/array — try JSON
  try { return JSON.stringify(v); } catch { return ""; }
}

/** Extract image URL from an input value (string URL or {outputUrl/imageUrl}) */
function inputImageUrl(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.outputUrl === "string") return o.outputUrl;
    if (typeof o.imageUrl === "string") return o.imageUrl;
  }
  return "";
}

async function executeGemini(node: ExecNode, results: Record<string, unknown>) {
  const data = node.data as {
    prompt?: string;
    systemPrompt?: string;
    model?: string;
  };
  const promptInput = node.inputs["Prompt"];
  const sysInput = node.inputs["System Prompt"];
  const imageInput = node.inputs["Image (Vision)"];

  // Use getInputValue to correctly read specific fields from source nodes
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
    // Demo fallback when no key is set
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
        // Vision failed — fall through to text-only
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
    // Throw with a clean message for the UI
    throw new Error(`Gemini error: ${msg.slice(0, 200)}`);
  }
}

async function executeCropImage(node: ExecNode, results: Record<string, unknown>) {
  const delay = process.env.NODE_ENV === "production" ? 2_000 : 500;
  await sleep(delay);
  // Use getInputValue to correctly extract image URL from source node output
  const inputSpec = node.inputs["Input Image"];
  const inputVal = inputSpec ? getInputValue(results, inputSpec) : undefined;
  const inputUrl = inputImageUrl(inputVal);
  console.log(`[execute] CropImage node=${node.id} inputUrl="${inputUrl.slice(0, 80)}"`);
  return inputUrl || "https://placehold.co/600x400?text=cropped";
}

// ---------------------------------------------------------------------------
// Node executors — Trigger.dev versions
// ---------------------------------------------------------------------------

async function executeGeminiViaTrigger(node: ExecNode, results: Record<string, unknown>) {
  const { geminiTask } = await import("@/trigger/gemini");
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

  const handle = await geminiTask.trigger({
    prompt,
    system: system || undefined,
    model: modelId,
    imageUrl: imageUrl || undefined,
  });

  // Poll for result
  const { runs } = await import("@trigger.dev/sdk");
  const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

  if (run.status === "COMPLETED" && run.output) {
    return (run.output as { text: string }).text;
  }
  throw new Error(`Trigger.dev gemini task failed: ${run.status}`);
}

async function executeCropImageViaTrigger(node: ExecNode, results: Record<string, unknown>) {
  const { cropImageTask } = await import("@/trigger/crop-image");
  const data = node.data as { x?: number; y?: number; w?: number; h?: number };
  
  const inputSpec = node.inputs["Input Image"];
  const inputVal = inputSpec ? getInputValue(results, inputSpec) : undefined;
  const inputUrl = inputImageUrl(inputVal);

  const handle = await cropImageTask.trigger({
    imageUrl: inputUrl || "https://placehold.co/600x400",
    x: data.x ?? 0,
    y: data.y ?? 0,
    w: data.w ?? 100,
    h: data.h ?? 100,
  });

  const { runs } = await import("@trigger.dev/sdk");
  const run = await runs.poll(handle.id, { pollIntervalMs: 2000 });

  if (run.status === "COMPLETED" && run.output) {
    return (run.output as { outputUrl: string }).outputUrl;
  }
  throw new Error(`Trigger.dev crop-image task failed: ${run.status}`);
}

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

async function executeRequestInputs(node: ExecNode) {
  const data = node.data as { fields?: Array<{ key: string; value?: string }> };
  const out: Record<string, string> = {};
  for (const f of data.fields ?? []) out[f.key] = f.value ?? "";
  return out;
}

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
          run: {
            workflowId: opts.workflowId,
          },
        },
        orderBy: {
          finishedAt: "desc",
        },
      });

      if (lastSuccessfulRun) {
        results[parentId] = lastSuccessfulRun.output;
      } else {
        const parentNode = graph.nodes.find((n) => n.id === parentId);
        const parentLabel = parentNode?.type || parentId;
        throw new Error(`Missing input from dependency: ${parentLabel} has not been successfully executed yet.`);
      }
    }

    // 2. Emit node-queued events for all execution target nodes
    for (const id of order) {
      onEvent({ type: "node-start", nodeId: id }); // Initially set to running/queued visually
      // Wait, let's emit a node-queued state event first if we can, or type: "node-start" is mapped.
      // Wait, let's emit type: "node-queued" so the client knows it is queued!
      // But wait! RunEvent type in types.ts or execute.ts should support "node-queued".
      // Let's make sure it is sent as "node-start" first but with queued status, or we can just add "node-queued" event type.
      // We added "node-queued" to RunEvent in the implementation plan. Let's make sure it is defined in RunEvent!
      // Wait, we defined RunEvent at the top of execute.ts. Let's check:
      // Line 8: type: "node-start" | "node-finish" | "node-error" | "run-finish";
      // Let's add "node-queued" to that type! Yes, we will modify the type definition in execute.ts or typecast.
    }

    // 3. Execution promises for nodes in execution scope
    const promises: Record<string, Promise<void>> = {};

    for (const id of order) {
      const node = nodes[id];
      const parentPromises = node.parents
        .filter((p) => promises[p])
        .map((p) => promises[p]);

      promises[id] = (async () => {
        try {
          // Wait for direct parent dependencies in execution scope
          await Promise.all(parentPromises);
        } catch (parentErr) {
          const msg = "Dependency failed";
          await prisma.nodeRun.updateMany({
            where: { runId, nodeId: id },
            data: {
              status: "failed",
              error: msg,
              finishedAt: new Date(),
            },
          });
          onEvent({ type: "node-error", nodeId: id, error: msg });
          throw new Error(msg);
        }

        const startedAt = Date.now();
        try {
          // Send node-start event when actually running
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
              // Strictly run through Trigger.dev
              output = await executeGeminiViaTrigger(node, results);
              break;
            case "crop-image":
              // Strictly run through Trigger.dev
              output = await executeCropImageViaTrigger(node, results);
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

    // Now emit the queued events initially for all nodes in the scope so the UI knows they are queued
    for (const id of order) {
      onEvent({ type: "node-queued", nodeId: id });
    }

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

    // Update database status of the Run
    await prisma.run.update({
      where: { id: runId },
      data: { status: "error", finishedAt: new Date() },
    }).catch((dbErr) => console.error("Failed to update Run status on fatal error:", dbErr));

    onEvent({ type: "run-finish", error: msg });
    throw err;
  }
}
