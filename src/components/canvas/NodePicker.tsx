"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  Search,
  Crop,
  Sparkles,
  X,
  Film,
  Mic,
  FileText,
  Globe,
  ImageIcon,
  Volume2,
  Clapperboard,
  ChevronRight,
  Type,
} from "lucide-react";
import { useCanvas } from "@/stores/canvas";
import type { NodeKind } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Item {
  kind: NodeKind;
  label: string;
  category: "AI" | "Image" | "Video" | "Audio" | "Utility";
  enabled: boolean;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  color: string; // icon color and background classes
}

const ITEMS: Item[] = [
  {
    kind: "gemini",
    label: "Gemini 3.1 Pro",
    category: "AI",
    enabled: true,
    Icon: Sparkles,
    description: "Run a Google Gemini prompt with multimodal inputs.",
    color: "bg-purple-500/10 text-purple-400 border border-purple-500/25",
  },
  {
    kind: "crop-image",
    label: "Crop Image",
    category: "Image",
    enabled: true,
    Icon: Crop,
    description: "Crop an image to a specific region.",
    color: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Generate Image",
    category: "Image",
    enabled: false,
    Icon: ImageIcon,
    description: "Generate images from text using AI models.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Edit Image",
    category: "Image",
    enabled: false,
    Icon: ImageIcon,
    description: "Edit and transform images with AI.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Generate Video",
    category: "Video",
    enabled: false,
    Icon: Film,
    description: "Generate video from text prompt.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Enhance Video",
    category: "Video",
    enabled: false,
    Icon: Clapperboard,
    description: "Enhance and upscale video quality.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "BG Remover",
    category: "Video",
    enabled: false,
    Icon: Film,
    description: "Remove background from video.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Text to Speech",
    category: "Audio",
    enabled: false,
    Icon: Volume2,
    description: "Convert text to natural speech.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Music Generation",
    category: "Audio",
    enabled: false,
    Icon: Mic,
    description: "Generate music from text prompts.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Sound Effects",
    category: "Audio",
    enabled: false,
    Icon: Volume2,
    description: "Generate sound effects using AI.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Text Node",
    category: "Utility",
    enabled: false,
    Icon: Type,
    description: "Static text node for workflow inputs.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "PDF Parser",
    category: "Utility",
    enabled: false,
    Icon: FileText,
    description: "Extract text from PDF documents.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
  {
    kind: "crop-image" as NodeKind,
    label: "Web Scraper",
    category: "Utility",
    enabled: false,
    Icon: Globe,
    description: "Scrape content from URLs.",
    color: "bg-neutral-100 dark:bg-zinc-800/50 text-neutral-400 dark:text-zinc-500 border border-neutral-200 dark:border-white/5",
  },
];

type Category = "All" | "AI" | "Image" | "Video" | "Audio" | "Utility";
const CATEGORIES: { id: Category; icon: string }[] = [
  { id: "All", icon: "✦" },
  { id: "AI", icon: "✦" },
  { id: "Image", icon: "🖼️" },
  { id: "Video", icon: "🎬" },
  { id: "Audio", icon: "🎵" },
  { id: "Utility", icon: "⚙️" },
];

const CATEGORY_LABELS: Record<string, string> = {
  AI: "AI Models",
  Image: "Image Tools",
  Video: "Video Tools",
  Audio: "Audio Tools",
  Utility: "Utilities",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NodePicker({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const inputRef = useRef<HTMLInputElement>(null);
  const addNode = useCanvas((s) => s.addNode);
  const rf = useReactFlow();

  useEffect(() => {
    if (open) {
      setQuery("");
      setCategory("All");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ITEMS.filter((i) => {
      if (q) return i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      if (category === "All") return true;
      return i.category === category;
    });
  }, [query, category]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-950/90 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.15s ease-out" }}
      >
        {/* Search bar */}
        <div className="px-3.5 py-3 border-b border-neutral-100 dark:border-white/5 flex items-center gap-2">
          <Search size={14} className="text-neutral-400 dark:text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes or models..."
            className="flex-1 outline-none text-sm text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 dark:placeholder:text-zinc-500 bg-transparent"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 dark:text-zinc-400 hover:text-neutral-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Category tabs */}
        {!query && (
          <div className="flex gap-1 px-2.5 py-2 border-b border-neutral-100 dark:border-white/5 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "shrink-0 px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all duration-150",
                  category === cat.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-zinc-200"
                )}
              >
                {cat.id}
              </button>
            ))}
          </div>
        )}

        {/* Body: node list */}
        <div className="max-h-80 overflow-y-auto">
          {Object.entries(grouped).length === 0 ? (
            <div className="py-8 text-sm text-neutral-400 dark:text-zinc-500 text-center">
              No matching nodes
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                {/* Category heading */}
                <div className="px-4 pt-4 pb-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                </div>
                {items.map((item) => (
                  <button
                    key={`${item.kind}-${item.label}`}
                    onClick={() => handlePick(item)}
                    disabled={!item.enabled}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-4 py-2.5 text-left transition-colors group",
                      item.enabled
                        ? "hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                        item.color
                      )}
                    >
                      <item.Icon size={13} />
                    </div>
                    {/* Label + desc */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-800 dark:text-zinc-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                        {item.label}
                        {!item.enabled && (
                          <span className="ml-2 px-1 py-0.5 rounded text-[8px] font-bold text-neutral-400 dark:text-zinc-500 bg-neutral-100 dark:bg-white/5 uppercase tracking-wide">
                            soon
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-0.5 truncate leading-normal">
                        {item.description}
                      </div>
                    </div>
                    {/* Arrow */}
                    <ChevronRight
                      size={12}
                      className="text-neutral-300 dark:text-zinc-600 group-hover:text-neutral-500 dark:group-hover:text-zinc-400 transition-colors shrink-0"
                    />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
