"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Plus, Trash2, Upload, Type, ImagePlus, X, FormInput } from "lucide-react";
import { useCanvas } from "@/stores/canvas";
import { NodeShell } from "./shared";
import { TypedHandle } from "./shared";
import type { RequestInputField, RequestInputsData } from "@/lib/types";
import { createImageUppy } from "@/lib/uppy";
import Dashboard from "@uppy/dashboard";

export function RequestInputsNode({ id, data }: NodeProps) {
  const d = data as unknown as RequestInputsData;
  const updateNodeData = useCanvas((s) => s.updateNodeData);
  const [pickerOpen, setPickerOpen] = useState(false);

  const addField = (kind: "text_field" | "image_field") => {
    const existing = d.fields.filter((f) => f.kind === kind).length;
    const key = existing === 0 ? kind : `${kind}_${existing + 1}`;
    const next: RequestInputField = { key, label: key, kind, value: "" };
    updateNodeData(id, { fields: [...d.fields, next] } as Partial<RequestInputsData>);
    setPickerOpen(false);
  };

  const removeField = (key: string) =>
    updateNodeData(id, {
      fields: d.fields.filter((f) => f.key !== key),
    } as Partial<RequestInputsData>);

  const updateField = (key: string, patch: Partial<RequestInputField>) =>
    updateNodeData(id, {
      fields: d.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    } as Partial<RequestInputsData>);

  return (
    <NodeShell id={id} title="Request Inputs" icon={<FormInput size={12} className="text-blue-400" />} closable={false}>
      <div className="space-y-2">
        {d.fields.map((f, idx) => (
          <FieldEditor
            key={f.key}
            field={f}
            top={idx * 56 + 28}
            onChange={(p) => updateField(f.key, p)}
            onRemove={() => removeField(f.key)}
          />
        ))}

        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-neutral-200 dark:border-white/10 text-xs text-neutral-400 dark:text-zinc-400 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-all duration-150 bg-transparent"
          >
            <Plus size={12} /> Add field
          </button>
          {pickerOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-950/95 border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl backdrop-blur-md p-1 z-10" style={{ animation: "scaleIn 0.1s ease-out" }}>
              <button
                onClick={() => addField("text_field")}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-xs text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <Type size={12} className="text-neutral-400 dark:text-zinc-400" /> text_field
              </button>
              <button
                onClick={() => addField("image_field")}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-xs text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <ImagePlus size={12} className="text-neutral-400 dark:text-zinc-400" /> image_field
              </button>
            </div>
          )}
        </div>
      </div>
    </NodeShell>
  );
}

function FieldEditor({
  field,
  top,
  onChange,
  onRemove,
}: {
  field: RequestInputField;
  top: number;
  onChange: (p: Partial<RequestInputField>) => void;
  onRemove: () => void;
}) {
  const handleType = field.kind === "image_field" ? "image" : "text";
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-zinc-900/40 p-2.5 space-y-1.5 relative">
      <TypedHandle type={handleType} side="right" id={field.key} top={top} />
      <div className="flex items-center justify-between gap-2">
        <input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="text-xs font-semibold bg-transparent outline-none focus:bg-neutral-100 dark:focus:bg-white/5 rounded-md px-1.5 py-0.5 flex-1 min-w-0 text-neutral-800 dark:text-zinc-200 focus:text-neutral-900 dark:focus:text-white border border-transparent focus:border-neutral-300 dark:focus:border-white/10 transition-all"
        />
        <button
          onClick={onRemove}
          className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-500 dark:hover:text-red-400 text-neutral-400 dark:text-zinc-500 transition-colors"
          title="Delete field"
        >
          <Trash2 size={11} />
        </button>
      </div>
      {field.kind === "text_field" ? (
        <textarea
          value={field.value ?? ""}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Enter text…"
          className="w-full text-xs px-2.5 py-1.5 border border-neutral-200 dark:border-white/5 rounded-lg resize-none focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/50 bg-white dark:bg-zinc-950/50 text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 dark:placeholder:text-zinc-500"
          rows={2}
        />
      ) : (
        <ImageFieldUpload value={field.value} onChange={(url) => onChange({ value: url })} />
      )}
    </div>
  );
}

function ImageFieldUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const uppyRef = useRef<ReturnType<typeof createImageUppy> | null>(null);

  // Create uppy instance
  useEffect(() => {
    const uppy = createImageUppy({
      onComplete: (url) => {
        onChange(url);
        setModalOpen(false);
      },
      onError: (msg) => {
        console.error("Upload error:", msg);
      },
    });
    uppyRef.current = uppy;
    return () => {
      uppy.clear();
      uppy.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount Uppy Dashboard when modal opens
  useEffect(() => {
    if (!modalOpen || !dashboardRef.current || !uppyRef.current) return;

    const uppy = uppyRef.current;

    // Uninstall previous dashboard instance if exists
    const existing = uppy.getPlugin("Dashboard");
    if (existing) uppy.removePlugin(existing);

    uppy.use(Dashboard, {
      target: dashboardRef.current,
      inline: true,
      width: "100%",
      height: 260,
      hideUploadButton: false,
      proudlyDisplayPoweredByUppy: false,
      hideProgressDetails: false,
      note: "Images only: jpg, png, webp, gif (max 10MB)",
    });

    return () => {
      const plugin = uppy.getPlugin("Dashboard");
      if (plugin) uppy.removePlugin(plugin);
    };
  }, [modalOpen]);

  return (
    <div className="space-y-1">
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-zinc-950/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-24 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="text-[10px] bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/5 backdrop-blur-sm px-2 py-1 rounded-md transition-colors"
            >
              Replace
            </button>
            <button
              onClick={() => onChange("")}
              className="text-[10px] bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/5 backdrop-blur-sm px-2 py-1 rounded-md transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 border border-neutral-200 dark:border-white/5 bg-white dark:bg-zinc-950/40 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-zinc-300 transition-colors"
        >
          <Upload size={10} /> Upload Image
        </button>
      )}

      {/* Upload Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl w-120 max-w-[90vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-white/5 text-neutral-900 dark:text-zinc-100">
              <h3 className="text-sm font-bold">Upload Image</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 dark:text-zinc-400 hover:text-neutral-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div ref={dashboardRef} className="uppy-dashboard-container bg-white dark:bg-zinc-950 p-2" />
          </div>
        </div>
      )}
    </div>
  );
}
