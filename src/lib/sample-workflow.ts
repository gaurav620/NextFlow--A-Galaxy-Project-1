import type { WorkflowGraph, NodeData } from "./types";

// Builds the required sample workflow from the spec:
// Request-Inputs -> {Crop #1, Crop #2, Gemini #1} -> Gemini #2 -> Final Gemini -> Response
export function sampleWorkflowGraph(): WorkflowGraph {
  return {
    version: 1,
    nodes: [
      {
        id: "request-inputs",
        type: "request-inputs",
        position: { x: 60, y: 320 },
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
      {
        id: "crop-1",
        type: "crop-image",
        position: { x: 420, y: 80 },
        data: { x: 20, y: 20, w: 60, h: 60 } as NodeData,
      },
      {
        id: "crop-2",
        type: "crop-image",
        position: { x: 420, y: 520 },
        data: { x: 0, y: 0, w: 100, h: 50 } as NodeData,
      },
      {
        id: "gemini-1",
        type: "gemini",
        position: { x: 420, y: 300 },
        data: {
          model: "Gemini 2.5 Flash",
          prompt: "",
          systemPrompt:
            "You are a marketing copywriter. Write a one-paragraph product description.",
          images: [],
        } as unknown as NodeData,
      },
      {
        id: "gemini-2",
        type: "gemini",
        position: { x: 820, y: 220 },
        data: {
          model: "Gemini 2.5 Flash",
          prompt: "",
          systemPrompt:
            "Condense the following product description into a tweet-length hook (under 240 characters).",
          images: [],
        } as unknown as NodeData,
      },
      {
        id: "gemini-final",
        type: "gemini",
        position: { x: 1220, y: 300 },
        data: {
          model: "Gemini 2.5 Flash",
          prompt: "",
          systemPrompt:
            "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
          images: [],
        } as unknown as NodeData,
      },
      {
        id: "response",
        type: "response",
        position: { x: 1620, y: 320 },
        data: {} as NodeData,
      },
    ],
    edges: [
      // Request-Inputs.image_field fans out to both crops
      { id: "e1", source: "request-inputs", sourceHandle: "image_field", target: "crop-1", targetHandle: "Input Image" },
      { id: "e2", source: "request-inputs", sourceHandle: "image_field", target: "crop-2", targetHandle: "Input Image" },
      // Request-Inputs.text_field -> Gemini #1.Prompt
      { id: "e3", source: "request-inputs", sourceHandle: "text_field", target: "gemini-1", targetHandle: "Prompt" },
      // Gemini #1.Response -> Gemini #2.Prompt
      { id: "e4", source: "gemini-1", sourceHandle: "Response", target: "gemini-2", targetHandle: "Prompt" },
      // Crops -> Final Gemini.Image (Vision)
      { id: "e5", source: "crop-1", sourceHandle: "Output Image", target: "gemini-final", targetHandle: "Image (Vision)" },
      { id: "e6", source: "crop-2", sourceHandle: "Output Image", target: "gemini-final", targetHandle: "Image (Vision)" },
      // Gemini #2.Response -> Final Gemini.Prompt
      { id: "e7", source: "gemini-2", sourceHandle: "Response", target: "gemini-final", targetHandle: "Prompt" },
      // Final Gemini.Response -> Response.result
      { id: "e8", source: "gemini-final", sourceHandle: "Response", target: "response", targetHandle: "result" },
    ],
  };
}
