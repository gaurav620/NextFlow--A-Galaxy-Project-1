"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Plus, Trash2, Upload, Type, ImagePlus, X } from "lucide-react";
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
    <NodeShell id={id} title="Request-Inputs" closable={false}>
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
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-neutral-300 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            <Plus size={12} /> Add field
          </button>
          {pickerOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 nf-card p-1 z-10">
              <button
                onClick={() => addField("text_field")}
                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-neutral-50 text-xs"
              >
                <Type size={12} /> text_field
              </button>
              <button
                onClick={() => addField("image_field")}
                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-neutral-50 text-xs"
              >
                <ImagePlus size={12} /> image_field
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
    <div className="rounded-md border border-neutral-200 p-2 space-y-1 relative">
      <TypedHandle type={handleType} side="right" id={field.key} top={top} />
      <div className="flex items-center justify-between gap-1">
        <input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="text-xs font-medium bg-transparent outline-none focus:bg-neutral-50 rounded px-1 flex-1 min-w-0"
        />
        <button
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-red-50 hover:text-red-600 text-neutral-400"
        >
          <Trash2 size={11} />
        </button>
      </div>
      {field.kind === "text_field" ? (
        <textarea
          value={field.value ?? ""}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Enter text…"
          className="w-full text-xs px-2 py-1 border border-neutral-200 rounded resize-none focus:outline-none focus:border-purple-400"
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
      height: 280,
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
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-24 object-cover rounded border border-neutral-200" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded">
            <button
              onClick={() => setModalOpen(true)}
              className="text-white text-[10px] bg-white/20 backdrop-blur px-2 py-1 rounded hover:bg-white/30"
            >
              Replace
            </button>
            <button
              onClick={() => onChange("")}
              className="text-white text-[10px] bg-white/20 backdrop-blur px-2 py-1 rounded hover:bg-white/30"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center gap-2 text-xs px-2 py-1.5 border border-neutral-200 rounded cursor-pointer hover:bg-neutral-50"
        >
          <Upload size={11} /> Upload Image
        </button>
      )}

      {/* Upload Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <h3 className="text-sm font-semibold">Upload Image</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-neutral-100"
              >
                <X size={14} />
              </button>
            </div>
            <div ref={dashboardRef} className="uppy-dashboard-container" />
          </div>
        </div>
      )}
    </div>
  );
}
