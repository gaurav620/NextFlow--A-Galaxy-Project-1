"use client";

import { useRef, useState, useEffect } from "react";
import type { NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Sparkles, Loader2, Upload, X } from "lucide-react";
import { useCanvas } from "@/stores/canvas";
import { NodeShell, FieldRow, NodeRunButton } from "./shared";
import type { GeminiData } from "@/lib/types";
import { createImageUppy } from "@/lib/uppy";
import Dashboard from "@uppy/dashboard";
import { cn } from "@/lib/cn";

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
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [visionUploadOpen, setVisionUploadOpen] = useState(false);

  const isConnected = (handle: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handle);

  const imageConnected = isConnected("Image (Vision)");
  const currentModel = d.model || "Gemini 3.1 Pro";

  return (
    <NodeShell
      id={id}
      title="Gemini"
      icon={<Sparkles size={12} className="text-purple-500" />}
      width={340}
      badge={<NodeRunButton />}
    >
      <div className="space-y-1">
        {/* Model horizontal pills */}
        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-neutral-100 mb-1 px-1">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Model</span>
          <div className="flex gap-1">
            {GEMINI_MODELS.map((m) => {
              const active = currentModel === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => updateNodeData(id, { model: m.value } as Partial<GeminiData>)}
                  className={cn(
                    "px-1.5 py-0.5 text-[9px] rounded font-medium border transition-all duration-150",
                    active
                      ? "bg-purple-50 border-purple-200 text-purple-600 shadow-sm"
                      : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                  )}
                >
                  {m.label.replace("Gemini ", "")}
                </button>
              );
            })}
          </div>
        </div>

        <FieldRow label="Prompt" type="text" side="left" handleId="Prompt" connected={isConnected("Prompt")}>
          <textarea
            value={d.prompt}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value } as Partial<GeminiData>)}
            placeholder="Enter your prompt…"
            rows={2}
            disabled={isConnected("Prompt")}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded resize-none focus:outline-none focus:border-purple-400 disabled:bg-neutral-50 disabled:text-neutral-400 bg-white"
          />
        </FieldRow>

        <FieldRow label="System Prompt" type="text" side="left" handleId="System Prompt" connected={isConnected("System Prompt")}>
          <textarea
            value={d.systemPrompt}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value } as Partial<GeminiData>)}
            placeholder="You are a helpful assistant…"
            rows={2}
            disabled={isConnected("System Prompt")}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded resize-none focus:outline-none focus:border-purple-400 disabled:bg-neutral-50 disabled:text-neutral-400 bg-white"
          />
        </FieldRow>

        {/* Image (Vision) — Upload button or preview when not connected */}
        <FieldRow label="Image (Vision)" type="image" side="left" handleId="Image (Vision)" connected={imageConnected}>
          {imageConnected ? (
            <span className="text-[11px] text-neutral-400 ml-1 italic">Connected ✓</span>
          ) : d.visionImageUrl ? (
            <div className="relative group w-20 h-12 rounded border border-neutral-200 overflow-hidden mt-1 ml-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.visionImageUrl}
                alt="Vision preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => updateNodeData(id, { visionImageUrl: undefined } as Partial<GeminiData>)}
                className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150"
                title="Remove image"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setVisionUploadOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors text-neutral-600 ml-1"
            >
              <Upload size={10} /> Upload Image
            </button>
          )}
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
                type="range" min={0} max={2} step={0.1}
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
                type="range" min={256} max={8192} step={256}
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
              <span className="text-[10px] text-neutral-300 italic">No output yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Vision Image Upload Modal */}
      {visionUploadOpen && (
        <VisionUploadModal
          onClose={() => setVisionUploadOpen(false)}
          onUpload={(url) => {
            updateNodeData(id, { visionImageUrl: url } as Partial<GeminiData>);
            setVisionUploadOpen(false);
          }}
        />
      )}
    </NodeShell>
  );
}

function VisionUploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (url: string) => void;
}) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const uppyRef = useRef<ReturnType<typeof createImageUppy> | null>(null);

  useEffect(() => {
    const uppy = createImageUppy({
      onComplete: (url) => onUpload(url),
      onError: (msg) => console.error("Vision upload error:", msg),
    });
    uppyRef.current = uppy;
    return () => { uppy.clear(); uppy.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dashboardRef.current || !uppyRef.current) return;
    const uppy = uppyRef.current;
    const existing = uppy.getPlugin("Dashboard");
    if (existing) uppy.removePlugin(existing);
    uppy.use(Dashboard, {
      target: dashboardRef.current,
      inline: true,
      width: "100%",
      height: 260,
      hideUploadButton: false,
      proudlyDisplayPoweredByUppy: false,
      note: "Images only (max 10MB)",
    });
    return () => { const p = uppy.getPlugin("Dashboard"); if (p) uppy.removePlugin(p); };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <h3 className="text-sm font-semibold">Upload Vision Image</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100"><X size={14} /></button>
        </div>
        <div ref={dashboardRef} className="uppy-dashboard-container" />
      </div>
    </div>
  );
}
