"use client";

import { useState } from "react";
import {
  Search, Upload, RefreshCw, ChevronDown, Grid3X3, List, Heart,
  Sparkles, FolderOpen, SlidersHorizontal, FileText, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/cn";

type MediaTab = "All" | "Generated" | "My Uploads" | "Favorites";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MediaTab>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const tabs: { label: MediaTab; icon: React.ReactNode }[] = [
    { label: "All", icon: <Grid3X3 size={13} /> },
    { label: "Generated", icon: <Sparkles size={13} /> },
    { label: "My Uploads", icon: <Upload size={13} /> },
    { label: "Favorites", icon: <Heart size={13} /> },
  ];

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">Media Library</h1>
            <p className="text-[13px] text-neutral-400 dark:text-zinc-500">0 files</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors">
            <Upload size={14} />
            Upload Media
          </button>
        </div>

        {/* Search bar */}
        <div className="relative my-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search prompts & file names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900/50 text-[13px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
          <button className="p-2 rounded-lg text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Your Media section */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1">
            <h2 className="text-[15px] font-bold text-neutral-900 dark:text-zinc-100 mr-4">Your Media</h2>
            {tabs.map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                  activeTab === label
                    ? "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300"
                    : "text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
              <ArrowUpDown size={12} /> Sort By <ChevronDown size={10} />
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
              <SlidersHorizontal size={12} /> Filters <ChevronDown size={10} />
            </button>
            <div className="flex items-center border border-neutral-200 dark:border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 transition-colors", viewMode === "grid" ? "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-zinc-100" : "text-neutral-400 dark:text-zinc-500")}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 transition-colors", viewMode === "list" ? "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-zinc-100" : "text-neutral-400 dark:text-zinc-500")}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar — All / My Folders */}
        <div className="flex gap-6">
          <div className="flex-1">
            {/* Empty state */}
            <div className="py-24 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <FileText size={24} className="text-neutral-300 dark:text-zinc-600" />
              </div>
              <p className="text-[14px] font-semibold text-neutral-900 dark:text-zinc-100 mb-1">No assets found</p>
              <p className="text-[13px] text-neutral-400 dark:text-zinc-500 mb-4">Upload files above, or generate content in chat</p>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-200 dark:border-white/10 text-[13px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                <Upload size={13} /> Upload files
              </button>
            </div>
          </div>

          {/* Folders panel */}
          <div className="w-[140px] shrink-0 hidden lg:block">
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-medium text-neutral-900 dark:text-zinc-100 mb-1">
              <Grid3X3 size={12} /> All
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-neutral-500 dark:text-zinc-400">
              <FolderOpen size={12} /> My Folders
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
