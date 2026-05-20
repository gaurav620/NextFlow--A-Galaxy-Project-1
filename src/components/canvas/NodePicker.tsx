"use client";

import { useState, useMemo, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { Search, Crop, Sparkles, X } from "lucide-react";
import { useCanvas } from "@/stores/canvas";
import type { NodeKind } from "@/lib/types";

interface Item {
  kind: NodeKind;
  label: string;
  category: "Image" | "LLM" | "Video" | "Audio" | "Others";
  enabled: boolean;
  Icon: React.ComponentType<{ size?: number }>;
  description: string;
}

const ITEMS: Item[] = [
  { kind: "crop-image", label: "Crop Image", category: "Image", enabled: true, Icon: Crop, description: "Crop an image to a region." },
  { kind: "gemini", label: "Gemini 2.5 Flash", category: "LLM", enabled: true, Icon: Sparkles, description: "Run a Google Gemini prompt." },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NodePicker({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"Recent" | "Image" | "LLM" | "Video" | "Audio" | "Others">("Image");
  const addNode = useCanvas((s) => s.addNode);
  const rf = useReactFlow();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ITEMS.filter((i) => {
      if (q) return i.label.toLowerCase().includes(q);
      if (tab === "Recent") return true;
      return i.category === tab;
    });
  }, [query, tab]);

  if (!open) return null;

  const handlePick = (item: Item) => {
    if (!item.enabled) return;
    const center = rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNode(item.kind, { x: center.x - 180, y: center.y - 100 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-200 flex items-center gap-3">
          <Search size={16} className="text-neutral-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes…"
            className="flex-1 outline-none text-sm placeholder:text-neutral-400"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-2 py-2 border-b border-neutral-200 flex gap-1">
          {(["Recent", "Image", "LLM", "Video", "Audio", "Others"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-md ${
                tab === t ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 text-neutral-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-sm text-neutral-500 text-center">No matching nodes</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.kind}
                onClick={() => handlePick(item)}
                disabled={!item.enabled}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-50 to-amber-50 flex items-center justify-center">
                  <item.Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-neutral-500 truncate">{item.description}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
