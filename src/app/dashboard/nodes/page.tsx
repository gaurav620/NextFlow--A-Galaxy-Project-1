"use client";

import { useState } from "react";
import { Search, Sparkles, Crop, Film, Mic, FileText, Globe, ImageIcon, Volume2, Type } from "lucide-react";
import { cn } from "@/lib/cn";

type NodeCategory = "All" | "AI" | "Image" | "Video" | "Audio" | "Utility";

const NODES = [
  { name: "Gemini 3.1 Pro", desc: "Run a Google Gemini prompt with multimodal inputs.", icon: Sparkles, category: "AI" as const, color: "text-purple-400 bg-purple-500/10" },
  { name: "Crop Image", desc: "Crop an image to a specific region.", icon: Crop, category: "Image" as const, color: "text-blue-400 bg-blue-500/10" },
  { name: "Text-to-Video", desc: "Generate video from text prompt.", icon: Film, category: "Video" as const, color: "text-pink-400 bg-pink-500/10", comingSoon: true },
  { name: "Text-to-Speech", desc: "Convert text to natural speech.", icon: Volume2, category: "Audio" as const, color: "text-green-400 bg-green-500/10", comingSoon: true },
  { name: "Speech-to-Text", desc: "Transcribe audio to text.", icon: Mic, category: "Audio" as const, color: "text-amber-400 bg-amber-500/10", comingSoon: true },
  { name: "Image Generation", desc: "Generate images from text prompts.", icon: ImageIcon, category: "Image" as const, color: "text-cyan-400 bg-cyan-500/10", comingSoon: true },
  { name: "Web Scraper", desc: "Extract content from web pages.", icon: Globe, category: "Utility" as const, color: "text-orange-400 bg-orange-500/10", comingSoon: true },
  { name: "Document Parser", desc: "Extract text from PDFs and documents.", icon: FileText, category: "Utility" as const, color: "text-indigo-400 bg-indigo-500/10", comingSoon: true },
  { name: "Text Transform", desc: "Format, translate, or transform text.", icon: Type, category: "Utility" as const, color: "text-teal-400 bg-teal-500/10", comingSoon: true },
];

const CATEGORIES: NodeCategory[] = ["All", "AI", "Image", "Video", "Audio", "Utility"];

export default function NodesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<NodeCategory>("All");

  const filtered = NODES.filter((n) => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "All" || n.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[960px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">Nodes</h1>
          <p className="text-[13px] text-neutral-400 dark:text-zinc-500">Run any model directly — text, image, video, audio.</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900/50 text-[13px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                activeCategory === cat
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-200 dark:border-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Node cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((node) => (
            <div
              key={node.name}
              className="rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 px-5 py-5 hover:shadow-md hover:border-neutral-300 dark:hover:border-white/15 transition-all duration-200 cursor-pointer group relative"
            >
              {node.comingSoon && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/5 text-[10px] font-medium text-neutral-400 dark:text-zinc-500">
                  Coming Soon
                </span>
              )}
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", node.color)}>
                <node.icon size={20} />
              </div>
              <h3 className="text-[14px] font-bold text-neutral-900 dark:text-zinc-100 mb-1">{node.name}</h3>
              <p className="text-[12px] text-neutral-500 dark:text-zinc-400 leading-relaxed">{node.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
