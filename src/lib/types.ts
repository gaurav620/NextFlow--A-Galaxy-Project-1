import { z } from "zod";

export type HandleType = "text" | "image" | "video" | "audio" | "file" | "any";

export const HANDLE_COLORS: Record<HandleType, string> = {
  text: "#3b82f6",
  image: "#f59e0b",
  video: "#ef4444",
  audio: "#10b981",
  file: "#8b5cf6",
  any: "#a1a1aa",
};

export type NodeKind = "request-inputs" | "crop-image" | "gemini" | "response";

export interface RequestInputField {
  key: string;
  label: string;
  kind: "text_field" | "image_field";
  value?: string;
}

export interface RequestInputsData {
  fields: RequestInputField[];
}

export interface CropImageData {
  x: number;
  y: number;
  w: number;
  h: number;
  inputImageUrl?: string;
  outputImageUrl?: string;
  connectedInputs?: Record<string, boolean>;
}

export interface GeminiData {
  model: string;
  prompt: string;
  systemPrompt: string;
  images: string[];
  responseText?: string;
  connectedInputs?: Record<string, boolean>;
}

export interface ResponseData {
  result?: string;
}

export type NodeData = Record<string, unknown>;

export interface WorkflowGraph {
  version: 1;
  nodes: {
    id: string;
    type: NodeKind;
    position: { x: number; y: number };
    data: NodeData;
  }[];
  edges: {
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
  }[];
}

export const WorkflowGraphSchema = z.object({
  version: z.literal(1),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["request-inputs", "crop-image", "gemini", "response"]),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.record(z.string(), z.unknown()),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      sourceHandle: z.string().optional(),
      target: z.string(),
      targetHandle: z.string().optional(),
    })
  ),
});

export function defaultWorkflowGraph(): WorkflowGraph {
  return {
    version: 1,
    nodes: [
      {
        id: "request-inputs",
        type: "request-inputs",
        position: { x: 80, y: 240 },
        data: {
          fields: [
            { key: "text_field", label: "text_field", kind: "text_field", value: "" },
          ],
        } as unknown as NodeData,
      },
      {
        id: "response",
        type: "response",
        position: { x: 980, y: 240 },
        data: {} as NodeData,
      },
    ],
    edges: [],
  };
}
