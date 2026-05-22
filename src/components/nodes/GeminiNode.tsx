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

// Model labels (UI) → API model IDs tooltip mapping
// Default is "Gemini 2.5 Flash" → maps to gemini-1.5-flash (free tier)
const GEMINI_MODELS = [
  { label: "2.5 Flash", displayName: "Gemini 2.5 Flash", apiModel: "gemini-1.5-flash", free: true },
  { label: "2.0 Flash", displayName: "Gemini 2.0 Flash", apiModel: "gemini-2.0-flash", free: true },
  { label: "3.1 Pro", displayName: "Gemini 3.1 Pro", apiModel: "gemini-1.5-pro", free: false },
  { label: "2.5 Pro", displayName: "Gemini 2.5 Pro", apiModel: "gemini-1.5-pro", free: false },
];

export function GeminiNode({ id, data }: NodeProps) {
  const d = data as unknown as GeminiData;
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const edges = useCanvas((s) => s.edges);
  const isRunning = useCanvas((s) => s.runningNodeIds.has(id));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visionUploadOpen, setVisionUploadOpen] = useState(false);

  const isConnected = (handle: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handle);

  const imageConnected = isConnected("Image (Vision)");
  // Default to "Gemini 2.5 Flash" (free tier) if not set
  const currentModel = d.model || "Gemini 2.5 Flash";
  const currentModelDef = GEMINI_MODELS.find((m) => m.displayName === currentModel) || GEMINI_MODELS[0];

  return (
    <NodeShell
      id={id}
      title="Gemini"
      icon={<Sparkles size={12} className="text-purple-400" />}
      width={340}
      badge={<NodeRunButton nodeId={id} />}
    >
      <div className="space-y-2">
        {/* Model horizontal pills */}
        <div className="flex items-center justify-between gap-1 pb-2 border-b border-white/5 mb-1.5 px-0.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Model</span>
          <div className="flex gap-1">
            {GEMINI_MODELS.map((m) => {
              const active = currentModel === m.displayName;
              return (
                <button
                  key={m.displayName}
                  onClick={() => updateNodeData(id, { model: m.displayName } as Partial<GeminiData>)}
                  title={`${m.displayName} (${m.apiModel})${m.free ? " • Free" : ""}`}
                  className={cn(
                    "px-2 py-0.5 text-[9px] rounded-md font-semibold border transition-all duration-150",
                    active
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/10"
                      : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300",
                    m.free && !active && "border-emerald-500/10"
                  )}
                >
                  {m.label}
                  {m.free && (
                    <span className={cn("ml-0.5", active ? "text-purple-400" : "text-emerald-600")}>●</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Active model hint */}
        <div className="text-[9px] text-zinc-600 px-0.5 -mt-1 mb-0.5">
          API: {currentModelDef.apiModel}{currentModelDef.free ? " · free tier" : ""}
        </div>

        <FieldRow label="Prompt" type="text" side="left" handleId="Prompt" connected={isConnected("Prompt")}>
          <textarea
            value={d.prompt}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value } as Partial<GeminiData>)}
            placeholder="Enter your prompt…"
            rows={2}
            disabled={isConnected("Prompt")}
            className="w-full text-xs px-2.5 py-1.5 border border-white/5 rounded-lg resize-none focus:outline-none focus:border-purple-500/50 disabled:opacity-40 disabled:bg-white/5 disabled:text-zinc-500 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-500"
          />
        </FieldRow>

        <FieldRow label="System Prompt" type="text" side="left" handleId="System Prompt" connected={isConnected("System Prompt")}>
          <textarea
            value={d.systemPrompt}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value } as Partial<GeminiData>)}
            placeholder="You are a helpful assistant…"
            rows={2}
            disabled={isConnected("System Prompt")}
            className="w-full text-xs px-2.5 py-1.5 border border-white/5 rounded-lg resize-none focus:outline-none focus:border-purple-500/50 disabled:opacity-40 disabled:bg-white/5 disabled:text-zinc-500 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-500"
          />
        </FieldRow>

        {/* Image (Vision) — Upload button or preview when not connected */}
        <FieldRow label="Image (Vision)" type="image" side="left" handleId="Image (Vision)" connected={imageConnected}>
          {imageConnected ? (
            <span className="text-[11px] text-zinc-500 ml-1.5 italic">Connected ✓</span>
          ) : d.visionImageUrl ? (
            <div className="relative group w-20 h-12 rounded-lg border border-white/10 overflow-hidden mt-1 ml-1">
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
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 border border-white/5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300 ml-1"
            >
              <Upload size={10} /> Upload Image
            </button>
          )}
        </FieldRow>

        <FieldRow label="Video" type="video" side="left" handleId="Video" connected={isConnected("Video")}>
          <span className="text-[11px] text-zinc-500 ml-1.5 italic">Connect video</span>
        </FieldRow>
        <FieldRow label="Audio" type="audio" side="left" handleId="Audio" connected={isConnected("Audio")}>
          <span className="text-[11px] text-zinc-500 ml-1.5 italic">Connect audio</span>
        </FieldRow>
        <FieldRow label="File" type="file" side="left" handleId="File" connected={isConnected("File")}>
          <span className="text-[11px] text-zinc-500 ml-1.5 italic">Connect file</span>
        </FieldRow>

        {/* Settings section */}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full text-[11px] text-zinc-400 flex items-center gap-1 mt-1.5 hover:text-zinc-200 transition-colors"
        >
          {settingsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <span>Settings</span>
        </button>
        {settingsOpen && (
          <div className="mt-1 space-y-2.5 pl-1 pb-1 bg-zinc-900/40 border border-white/5 rounded-lg p-2.5">
            <div>
              <label className="text-[10px] text-zinc-400 flex items-center justify-between mb-1">
                Temperature
                <span className="tabular-nums font-semibold text-zinc-200">
                  {(d as unknown as Record<string, unknown>).temperature as number ?? 0.7}
                </span>
              </label>
              <input
                type="range" min={0} max={2} step={0.1}
                value={(d as unknown as Record<string, unknown>).temperature as number ?? 0.7}
                onChange={(e) => updateNodeData(id, { temperature: parseFloat(e.target.value) } as Partial<GeminiData>)}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 flex items-center justify-between mb-1">
                Max Tokens
                <span className="tabular-nums font-semibold text-zinc-200">
                  {(d as unknown as Record<string, unknown>).maxTokens as number ?? 2048}
                </span>
              </label>
              <input
                type="range" min={256} max={8192} step={256}
                value={(d as unknown as Record<string, unknown>).maxTokens as number ?? 2048}
                onChange={(e) => updateNodeData(id, { maxTokens: parseInt(e.target.value) } as Partial<GeminiData>)}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        )}

        {/* Output / Response */}
        <div className="mt-2 border-t border-white/5 pt-2 relative">
          <FieldRow label="Response" type="text" side="right" handleId="Response" />
          {isRunning ? (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5">
              <Loader2 size={11} className="animate-spin text-purple-400" />
              <span className="italic">Thinking…</span>
            </div>
          ) : d.responseText ? (
            <div className="mt-2 p-2.5 text-[11px] bg-gradient-to-br from-purple-950/20 to-zinc-900/20 border border-purple-500/20 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap text-zinc-300 leading-relaxed" style={{ animation: "fadeIn 0.3s ease-out" }}>
              {d.responseText}
            </div>
          ) : (
            <div className="mt-2 h-10 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
              <span className="text-[10px] text-zinc-500 italic">No output yet</span>
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md" onClick={onClose}>
      <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 text-zinc-100">
          <h3 className="text-sm font-bold">Upload Vision Image</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200"><X size={14} /></button>
        </div>
        <div ref={dashboardRef} className="uppy-dashboard-container bg-zinc-950 p-2" />
      </div>
    </div>
  );
}
