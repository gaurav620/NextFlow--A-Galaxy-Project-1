import type { WorkflowGraph, NodeData } from "./types";

/**
 * Builds the required 7-node sample workflow from the spec:
 *
 * Request-Inputs ──┬──> Crop #1 ──────────────────────> Final Gemini ──> Response
 *                  ├──> Crop #2 ──────────────────────>       ↑
 *                  ├──> Gemini #1 ──> Gemini #2 ─────────────>↑
 *                  │                    ↑
 *                  └────────────────────┘ (text_field → Gemini #1.Prompt)
 *
 * Parallelism: Crop #1, Crop #2, and Gemini #1 all start simultaneously.
 * Gemini #2 waits for Gemini #1. Final Gemini waits for both crops + Gemini #2.
 *
 * Node positions spread horizontally left→right matching the reference canvas.
 */
export function sampleWorkflowGraph(): WorkflowGraph {
  return {
    version: 1,
    nodes: [
      // Layer 0 — Request Inputs (left)
      {
        id: "request-inputs",
        type: "request-inputs",
        position: { x: 60, y: 300 },
        data: {
          fields: [
            {
              key: "text_field",
              label: "text_field",
              kind: "text_field",
              value:
                "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
            },
            {
              key: "image_field",
              label: "image_field",
              kind: "image_field",
              value: "",
            },
          ],
        } as unknown as NodeData,
      },

      // Layer 1 — Crop #1 (top), Crop #2 (bottom), Gemini #1 (middle)
      {
        id: "crop-1",
        type: "crop-image",
        position: { x: 500, y: 60 },
        data: { x: 20, y: 20, w: 60, h: 60 } as NodeData,
      },
      {
        id: "gemini-1",
        type: "gemini",
        position: { x: 500, y: 300 },
        data: {
          model: "Gemini 2.5 Flash",
          prompt: "",
          systemPrompt:
            "You are a marketing copywriter. Write a one-paragraph product description.",
          images: [],
        } as unknown as NodeData,
      },
      {
        id: "crop-2",
        type: "crop-image",
        position: { x: 500, y: 560 },
        data: { x: 0, y: 0, w: 100, h: 50 } as NodeData,
      },

      // Layer 2 — Gemini #2 (waits for Gemini #1)
      {
        id: "gemini-2",
        type: "gemini",
        position: { x: 940, y: 300 },
        data: {
          model: "Gemini 2.5 Flash",
          prompt: "",
          systemPrompt:
            "Condense the following product description into a tweet-length hook (under 240 characters).",
          images: [],
        } as unknown as NodeData,
      },

      // Layer 3 — Final Gemini (waits for crops + Gemini #2)
      {
        id: "gemini-final",
        type: "gemini",
        position: { x: 1360, y: 300 },
        data: {
          model: "Gemini 2.5 Flash",
          prompt: "",
          systemPrompt:
            "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
          images: [],
        } as unknown as NodeData,
      },

      // Layer 4 — Response (right)
      {
        id: "response",
        type: "response",
        position: { x: 1780, y: 300 },
        data: {} as NodeData,
      },
    ],

    edges: [
      // Request-Inputs → Crop #1 and Crop #2 (image edges — amber color)
      {
        id: "e-ri-crop1",
        source: "request-inputs",
        sourceHandle: "image_field",
        target: "crop-1",
        targetHandle: "Input Image",
      },
      {
        id: "e-ri-crop2",
        source: "request-inputs",
        sourceHandle: "image_field",
        target: "crop-2",
        targetHandle: "Input Image",
      },
      // Request-Inputs.text_field → Gemini #1.Prompt (text edge — purple)
      {
        id: "e-ri-g1",
        source: "request-inputs",
        sourceHandle: "text_field",
        target: "gemini-1",
        targetHandle: "Prompt",
      },
      // Gemini #1.Response → Gemini #2.Prompt (text edge — purple)
      {
        id: "e-g1-g2",
        source: "gemini-1",
        sourceHandle: "Response",
        target: "gemini-2",
        targetHandle: "Prompt",
      },
      // Crop #1 → Final Gemini.Image (Vision) (image edge — amber)
      {
        id: "e-crop1-gf",
        source: "crop-1",
        sourceHandle: "Output Image",
        target: "gemini-final",
        targetHandle: "Image (Vision)",
      },
      // Crop #2 → Final Gemini.Image (Vision) (image edge — amber)
      {
        id: "e-crop2-gf",
        source: "crop-2",
        sourceHandle: "Output Image",
        target: "gemini-final",
        targetHandle: "Image (Vision)",
      },
      // Gemini #2.Response → Final Gemini.Prompt (text edge — purple)
      {
        id: "e-g2-gf",
        source: "gemini-2",
        sourceHandle: "Response",
        target: "gemini-final",
        targetHandle: "Prompt",
      },
      // Final Gemini.Response → Response.result (text edge — purple)
      {
        id: "e-gf-resp",
        source: "gemini-final",
        sourceHandle: "Response",
        target: "response",
        targetHandle: "result",
      },
    ],
  };
}
