"use client";

import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCanvas } from "@/stores/canvas";
import { NodeShell, FieldRow } from "./shared";
import type { GeminiData } from "@/lib/types";

export function GeminiNode({ id, data }: NodeProps) {
  const d = data as unknown as GeminiData;
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const edges = useCanvas((s) => s.edges);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isConnected = (handle: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handle);

  return (
    <NodeShell
      id={id}
      title={d.model || "Gemini 2.5 Flash"}
      width={340}
      badge={
        <>
          <select
            value={d.model}
            onChange={(e) => updateNodeData(id, { model: e.target.value } as Partial<GeminiData>)}
            className="text-[11px] border border-neutral-200 rounded px-1.5 py-0.5 bg-white"
          >
            <option>Gemini 2.5 Flash</option>
            <option>Gemini 2.5 Pro</option>
            <option>Gemini 2.0 Flash</option>
          </select>
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
            ● Run
          </span>
        </>
      }
    >
      <div className="space-y-1">
        <FieldRow label="Prompt" type="text" side="left" handleId="Prompt" connected={isConnected("Prompt")}>
          <textarea
            value={d.prompt}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value } as Partial<GeminiData>)}
            placeholder="Prompt…"
            rows={2}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded resize-none focus:outline-none focus:border-purple-400"
          />
        </FieldRow>
        <FieldRow label="System Prompt" type="text" side="left" handleId="System Prompt" connected={isConnected("System Prompt")}>
          <textarea
            value={d.systemPrompt}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value } as Partial<GeminiData>)}
            placeholder="System prompt…"
            rows={2}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded resize-none focus:outline-none focus:border-purple-400"
          />
        </FieldRow>
        <FieldRow label="Image (Vision)" type="image" side="left" handleId="Image (Vision)" connected={isConnected("Image (Vision)")}>
          <span className="text-[11px] text-neutral-400 ml-2">Upload Image</span>
        </FieldRow>
        <FieldRow label="Video" type="video" side="left" handleId="Video" connected={isConnected("Video")}>
          <span className="text-[11px] text-neutral-400 ml-2">Upload Video</span>
        </FieldRow>
        <FieldRow label="Audio" type="audio" side="left" handleId="Audio" connected={isConnected("Audio")}>
          <span className="text-[11px] text-neutral-400 ml-2">Upload Audio</span>
        </FieldRow>
        <FieldRow label="File" type="file" side="left" handleId="File" connected={isConnected("File")}>
          <span className="text-[11px] text-neutral-400 ml-2">Upload File</span>
        </FieldRow>

        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full text-[11px] text-neutral-500 flex items-center gap-1 mt-1 hover:text-neutral-700"
        >
          {settingsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />} Settings
        </button>
        {settingsOpen && (
          <div className="mt-1 space-y-2 pl-1 pb-1">
            <div>
              <label className="text-[10px] text-neutral-500 flex items-center justify-between">
                Temperature
                <span className="tabular-nums">{(d as unknown as Record<string, unknown>).temperature as number ?? 0.7}</span>
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={(d as unknown as Record<string, unknown>).temperature as number ?? 0.7}
                onChange={(e) => updateNodeData(id, { temperature: parseFloat(e.target.value) } as Partial<GeminiData>)}
                className="w-full accent-purple-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 flex items-center justify-between">
                Max Tokens
                <span className="tabular-nums">{(d as unknown as Record<string, unknown>).maxTokens as number ?? 2048}</span>
              </label>
              <input
                type="range"
                min={1}
                max={8192}
                step={256}
                value={(d as unknown as Record<string, unknown>).maxTokens as number ?? 2048}
                onChange={(e) => updateNodeData(id, { maxTokens: parseInt(e.target.value) } as Partial<GeminiData>)}
                className="w-full accent-purple-600"
              />
            </div>
          </div>
        )}

        <div className="mt-2 border-t border-neutral-100 pt-2 relative">
          <FieldRow label="Response" type="text" side="right" handleId="Response" />
          {d.responseText && (
            <div className="mt-2 p-2 text-[11px] bg-neutral-50 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
              {d.responseText}
            </div>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
