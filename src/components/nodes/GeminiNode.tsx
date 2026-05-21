"use client";

import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { useCanvas } from "@/stores/canvas";
import { NodeShell, FieldRow } from "./shared";
import type { GeminiData } from "@/lib/types";

// Per spec: "Gemini 3.1 Pro" as the label (maps to gemini-1.5-pro API internally)
const GEMINI_MODELS = [
  { label: "Gemini 3.1 Pro", value: "Gemini 3.1 Pro" },
  { label: "Gemini 2.5 Flash", value: "Gemini 2.5 Flash" },
  { label: "Gemini 2.5 Pro", value: "Gemini 2.5 Pro" },
  { label: "Gemini 2.0 Flash", value: "Gemini 2.0 Flash" },
];

export function GeminiNode({ id, data }: NodeProps) {
  const d = data as unknown as GeminiData;
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const edges = useCanvas((s) => s.edges);
  const isRunning = useCanvas((s) => s.runningNodeIds.has(id));
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isConnected = (handle: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handle);

  const currentModel = d.model || "Gemini 3.1 Pro";

  return (
    <NodeShell
      id={id}
      title={currentModel}
      icon={<Sparkles size={12} className="text-purple-500" />}
      width={340}
      badge={
        <>
          <select
            value={currentModel}
            onChange={(e) => updateNodeData(id, { model: e.target.value } as Partial<GeminiData>)}
            className="text-[11px] border border-neutral-200 rounded px-1.5 py-0.5 bg-white text-neutral-700 focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
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
            placeholder="Enter prompt…"
            rows={2}
            disabled={isConnected("Prompt")}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded resize-none focus:outline-none focus:border-purple-400 disabled:bg-neutral-50 disabled:text-neutral-400 bg-white"
          />
        </FieldRow>
        <FieldRow label="System Prompt" type="text" side="left" handleId="System Prompt" connected={isConnected("System Prompt")}>
          <textarea
            value={d.systemPrompt}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value } as Partial<GeminiData>)}
            placeholder="System prompt…"
            rows={2}
            disabled={isConnected("System Prompt")}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded resize-none focus:outline-none focus:border-purple-400 disabled:bg-neutral-50 disabled:text-neutral-400 bg-white"
          />
        </FieldRow>
        <FieldRow label="Image (Vision)" type="image" side="left" handleId="Image (Vision)" connected={isConnected("Image (Vision)")}>
          <span className="text-[11px] text-neutral-400 ml-1 italic">Connect image handle</span>
        </FieldRow>
        <FieldRow label="Video" type="video" side="left" handleId="Video" connected={isConnected("Video")}>
          <span className="text-[11px] text-neutral-400 ml-1 italic">Connect video</span>
        </FieldRow>
        <FieldRow label="Audio" type="audio" side="left" handleId="Audio" connected={isConnected("Audio")}>
          <span className="text-[11px] text-neutral-400 ml-1 italic">Connect audio</span>
        </FieldRow>
        <FieldRow label="File" type="file" side="left" handleId="File" connected={isConnected("File")}>
          <span className="text-[11px] text-neutral-400 ml-1 italic">Connect file</span>
        </FieldRow>

        {/* Settings section */}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full text-[11px] text-neutral-500 flex items-center gap-1 mt-1 hover:text-neutral-700 transition-colors"
        >
          {settingsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <span>Settings</span>
        </button>
        {settingsOpen && (
          <div className="mt-1 space-y-2 pl-1 pb-1 bg-neutral-50/50 rounded-md p-2">
            <div>
              <label className="text-[10px] text-neutral-500 flex items-center justify-between mb-1">
                Temperature
                <span className="tabular-nums font-medium text-neutral-700">
                  {(d as unknown as Record<string, unknown>).temperature as number ?? 0.7}
                </span>
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
              <label className="text-[10px] text-neutral-500 flex items-center justify-between mb-1">
                Max Tokens
                <span className="tabular-nums font-medium text-neutral-700">
                  {(d as unknown as Record<string, unknown>).maxTokens as number ?? 2048}
                </span>
              </label>
              <input
                type="range"
                min={256}
                max={8192}
                step={256}
                value={(d as unknown as Record<string, unknown>).maxTokens as number ?? 2048}
                onChange={(e) => updateNodeData(id, { maxTokens: parseInt(e.target.value) } as Partial<GeminiData>)}
                className="w-full accent-purple-600"
              />
            </div>
          </div>
        )}

        {/* Output / Response */}
        <div className="mt-2 border-t border-neutral-100 pt-2 relative">
          <FieldRow label="Response" type="text" side="right" handleId="Response" />
          {isRunning ? (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-purple-600 bg-purple-50 rounded p-2">
              <Loader2 size={11} className="animate-spin" />
              <span className="italic">Thinking…</span>
            </div>
          ) : d.responseText ? (
            <div className="mt-2 p-2 text-[11px] bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded max-h-32 overflow-y-auto whitespace-pre-wrap text-neutral-700 leading-relaxed" style={{ animation: "fadeIn 0.3s ease-out" }}>
              {d.responseText}
            </div>
          ) : (
            <div className="mt-2 h-10 rounded border border-dashed border-neutral-200 flex items-center justify-center">
              <span className="text-[10px] text-neutral-300 italic">Response will appear here</span>
            </div>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
