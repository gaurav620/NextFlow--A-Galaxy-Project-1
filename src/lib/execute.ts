import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import { buildExecGraph, type ExecNode } from "@/lib/dag";
import type { WorkflowGraph } from "@/lib/types";

export interface RunEvent {
  type: "node-start" | "node-finish" | "node-error" | "run-finish";
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

/** Map UI model names to Google AI SDK model identifiers */
function resolveModelId(uiName?: string): string {
  switch (uiName) {
    // Per spec: "Gemini 3.1 Pro" is the label; maps to gemini-1.5-pro (free tier)
    case "Gemini 3.1 Pro":
      return "gemini-1.5-pro";
    case "Gemini 2.5 Flash":
      return "gemini-2.5-flash-preview-05-20";
    case "Gemini 2.5 Pro":
      return "gemini-2.5-pro-preview-05-06";
    case "Gemini 2.0 Flash":
      return "gemini-2.0-flash";
    default:
      // Default to gemini-1.5-pro (the spec default "Gemini 3.1 Pro")
      return "gemini-1.5-pro";
  }
}

// ---------------------------------------------------------------------------
// Node executors — in-process (local dev) versions
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
    ? String(results[promptInput.source] ?? "")
    : data.prompt ?? "";
  const system = sysInput
    ? String(results[sysInput.source] ?? "")
    : data.systemPrompt ?? "";
  const imageUrl = imageInput
    ? String(results[imageInput.source] ?? "")
    : "";

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    // Demo fallback when no key is set
    await sleep(1500);
    return `[Gemini mock output for prompt: "${prompt.slice(0, 80)}…"]`;
  }

  const modelId = resolveModelId(data.model);

  try {
    // Build messages array — support multimodal (image + text)
    if (imageUrl && imageUrl.startsWith("http")) {
      // Use URL directly (Gemini SDK accepts URL images)
      const { generateText: genText } = await import("ai");
      try {
        const { text } = await genText({
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
        // If vision fails (e.g. URL not accessible), fall through to text-only
        console.warn("[execute] Vision failed, falling back to text-only:", visionErr);
      }
    }

    // Text-only path
    const { text } = await generateText({
      model: google(modelId),
      system: system || undefined,
      prompt,
    });
    return text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Gemini execution failed (model=${modelId}):`, msg);
    throw new Error(`Gemini API error (${modelId}): ${msg}`);
  }
}

async function executeCropImage(node: ExecNode, results: Record<string, unknown>) {
  // Simulate processing time — short delay in dev, longer in prod
  // The actual 30s wait is only required when using Trigger.dev tasks
  const delay = process.env.NODE_ENV === "production" ? 2_000 : 500;
  await sleep(delay);
  const inputUrl = node.inputs["Input Image"]
    ? String(results[node.inputs["Input Image"].source] ?? "")
    : "";
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
  const prompt = promptInput
    ? String(results[promptInput.source] ?? "")
    : data.prompt ?? "";
  const system = sysInput
    ? String(results[sysInput.source] ?? "")
    : data.systemPrompt ?? "";

  const modelId = resolveModelId(data.model);

  const handle = await geminiTask.trigger({
    prompt,
    system: system || undefined,
    model: modelId,
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
  const inputUrl = node.inputs["Input Image"]
    ? String(results[node.inputs["Input Image"].source] ?? "")
    : "";

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
  const { nodes, order } = buildExecGraph(graph, scope, targetNodeIds);
  const triggerEnabled = useTriggerDev();

  if (triggerEnabled) {
    console.log("[execute] Trigger.dev mode enabled — dispatching tasks via Trigger.dev");
  } else {
    console.log("[execute] In-process mode — running tasks locally");
  }

  // Per-node promise barriers so siblings fan out concurrently
  const results: Record<string, unknown> = {};
  const promises: Record<string, Promise<void>> = {};

  for (const id of order) {
    const node = nodes[id];
    const parentPromises = node.parents
      .filter((p) => promises[p])
      .map((p) => promises[p]);

    promises[id] = (async () => {
      await Promise.all(parentPromises);
      const startedAt = Date.now();
      try {
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
            output = triggerEnabled
              ? await executeGeminiViaTrigger(node, results)
              : await executeGemini(node, results);
            break;
          case "crop-image":
            output = triggerEnabled
              ? await executeCropImageViaTrigger(node, results)
              : await executeCropImage(node, results);
            break;
          case "response": {
            // Read from the 'result' handle's connected source first
            const resultInput = node.inputs["result"];
            if (resultInput) {
              const sourceOutput = results[resultInput.source];
              // If source output is an object (e.g. request-inputs returns Record), stringify it
              if (typeof sourceOutput === "object" && sourceOutput !== null) {
                output = JSON.stringify(sourceOutput, null, 2);
              } else {
                output = sourceOutput;
              }
            } else {
              // Fallback: take the last parent's output
              output = node.parents
                .map((p) => results[p])
                .filter((v) => v !== undefined)
                .pop();
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
}
