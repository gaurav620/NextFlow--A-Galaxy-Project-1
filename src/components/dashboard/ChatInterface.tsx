"use client";

import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Mic,
  Send,
  ChevronDown,
  Sparkles,
  Cpu,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

const MODELS = [
  { id: "auto", name: "NextFlow Auto", desc: "Automatically picks the best model fo...", icon: "✨" },
  { id: "pro", name: "Gemini Pro Max", desc: "Most capable model for ambitious pr...", icon: "💎" },
  { id: "flash", name: "Gemini Flash", desc: "Maximum speed for quick tas...", icon: "⚡" },
];

const CATEGORIES = [
  "Workflow Templates",
  "Text Generation",
  "Content Creation",
  "Image Processing",
  "Data Analysis",
  "All",
];

const TEMPLATES = [
  {
    title: "Product Marketing Copy",
    desc: "Generate compelling marketing copy from product descriptions — social posts, email campaigns, ad creatives.",
    gradient: "from-purple-500/20 to-blue-500/20",
    icon: "📝",
  },
  {
    title: "Image Processing Pipeline",
    desc: "Crop, enhance and transform images with AI — batch processing with automated quality checks.",
    gradient: "from-orange-500/20 to-red-500/20",
    icon: "🖼️",
  },
  {
    title: "Multi-Model Comparison",
    desc: "Run the same prompt across multiple AI models and compare outputs side-by-side for best results.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    icon: "🔄",
  },
  {
    title: "Content Repurposing",
    desc: "Transform blog posts into social media threads, newsletters, video scripts and podcast outlines.",
    gradient: "from-pink-500/20 to-violet-500/20",
    icon: "♻️",
  },
  {
    title: "Data Extraction & Analysis",
    desc: "Extract structured data from documents, images and PDFs — with AI-powered analysis and summaries.",
    gradient: "from-cyan-500/20 to-blue-500/20",
    icon: "📊",
  },
  {
    title: "AI Writing Assistant",
    desc: "Draft, edit and refine any type of writing — from emails to essays, with customizable tone and style.",
    gradient: "from-amber-500/20 to-yellow-500/20",
    icon: "✍️",
  },
];

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Workflow Templates");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    if (modelDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [modelDropdownOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[780px] mx-auto px-6 py-6">

        {/* Model selector — top left */}
        <div className="relative mb-8" ref={dropdownRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-[13px] font-medium text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-white/10 flex items-center justify-center text-[10px]">
              {selectedModel.icon}
            </span>
            {selectedModel.name}
            <ChevronDown size={12} className={cn("text-neutral-400 transition-transform", modelDropdownOpen && "rotate-180")} />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-[260px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Models</p>
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => { setSelectedModel(model); setModelDropdownOpen(false); }}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors",
                    selectedModel.id === model.id && "bg-purple-50 dark:bg-purple-500/10"
                  )}
                >
                  <span className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white/10 flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    {model.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">{model.name}</p>
                    <p className="text-[11px] text-neutral-400 dark:text-zinc-500 truncate">{model.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] md:text-[40px] font-extrabold text-neutral-900 dark:text-zinc-100 tracking-tight leading-tight mb-3">
            One agent, all AI models.
          </h1>
          <p className="text-[15px] text-neutral-500 dark:text-zinc-400 max-w-[480px] mx-auto">
            NextFlow is your all-in-one AI super agent. Just tell it what you want to get done!
          </p>
        </div>

        {/* Chat input — Magica style */}
        <div className="mb-8">
          <div className="relative border border-neutral-200 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-300 dark:focus-within:border-purple-500/30 transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Assign a task or ask anything"
              rows={2}
              className="w-full px-5 pt-4 pb-2 text-[14px] text-neutral-900 dark:text-zinc-100 bg-transparent placeholder-neutral-400 dark:placeholder-zinc-500 resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-1">
                <button
                  title="Attach files"
                  className="p-1.5 rounded-md text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  title="Connect apps"
                  className="p-1.5 rounded-md text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                >
                  <Zap size={16} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  title="Voice input"
                  className="p-1.5 rounded-md text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                >
                  <Mic size={16} />
                </button>
                <button
                  title="Send"
                  disabled={!inputValue.trim()}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                    inputValue.trim()
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                      : "bg-neutral-200 dark:bg-zinc-700 text-neutral-400 dark:text-zinc-500"
                  )}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors",
                activeCategory === cat
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "bg-transparent text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-200 dark:border-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template cards — 3 column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {TEMPLATES.map((t) => (
            <div
              key={t.title}
              className="group rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 overflow-hidden hover:shadow-lg hover:border-neutral-300 dark:hover:border-white/15 transition-all duration-200 cursor-pointer"
            >
              {/* Card image area — gradient placeholder */}
              <div className={cn("h-[140px] bg-gradient-to-br flex items-center justify-center", t.gradient)}>
                <span className="text-4xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-200">
                  {t.icon}
                </span>
              </div>
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-bold text-neutral-900 dark:text-zinc-100 mb-1">{t.title}</h3>
                <p className="text-[12px] text-neutral-500 dark:text-zinc-400 leading-relaxed line-clamp-3">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-neutral-400 dark:text-zinc-500 pb-4">
          NextFlow is AI and can make mistakes. Please double-check responses.
        </p>
      </div>
    </div>
  );
}
