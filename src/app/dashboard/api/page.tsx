"use client";

import { useState } from "react";
import { Copy, Check, Terminal, ExternalLink, Key, Code2 } from "lucide-react";
import { cn } from "@/lib/cn";

export default function ApiPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app";

  const endpoints = [
    { method: "GET", path: "/api/workflows/:id", desc: "Get workflow details" },
    { method: "PATCH", path: "/api/workflows/:id", desc: "Update workflow name or graph" },
    { method: "DELETE", path: "/api/workflows/:id", desc: "Delete workflow" },
    { method: "POST", path: "/api/runs", desc: "Start a workflow run" },
    { method: "GET", path: "/api/runs/:id", desc: "Get run status and results" },
    { method: "POST", path: "/api/runs/:id/cancel", desc: "Cancel a running workflow" },
    { method: "GET", path: "/api/runs/:id/stream", desc: "SSE stream for real-time updates" },
  ];

  const METHOD_COLORS: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PATCH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[780px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">API / MCP</h1>
            <p className="text-[13px] text-neutral-400 dark:text-zinc-500">Use NextFlow from your code or an MCP-aware agent.</p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-white/10 text-[13px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={13} /> Docs
          </a>
        </div>

        {/* Base URL */}
        <div className="rounded-xl border border-neutral-200 dark:border-white/8 bg-neutral-50 dark:bg-zinc-900/30 px-5 py-4 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-2">Base URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[13px] font-mono text-neutral-900 dark:text-zinc-100">{baseUrl}</code>
            <button
              onClick={() => copyToClipboard(baseUrl, "base")}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
            >
              {copied === "base" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-8">
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-zinc-100 mb-4">Endpoints</h2>
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 hover:border-neutral-300 dark:hover:border-white/15 transition-all">
                <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-bold", METHOD_COLORS[ep.method])}>
                  {ep.method}
                </span>
                <code className="text-[13px] font-mono text-neutral-900 dark:text-zinc-100 flex-1">{ep.path}</code>
                <span className="text-[12px] text-neutral-400 dark:text-zinc-500 hidden sm:inline">{ep.desc}</span>
                <button
                  onClick={() => copyToClipboard(`${baseUrl}${ep.path}`, ep.path)}
                  className="p-1 rounded text-neutral-300 dark:text-zinc-600 hover:text-neutral-500 dark:hover:text-zinc-400 transition-colors"
                >
                  {copied === ep.path ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Example */}
        <div>
          <h2 className="text-[15px] font-bold text-neutral-900 dark:text-zinc-100 mb-4">Quick Start</h2>
          <div className="rounded-xl border border-neutral-200 dark:border-white/8 bg-[#1e1e1e] dark:bg-zinc-900/50 p-5 overflow-x-auto">
            <pre className="text-[12px] font-mono text-zinc-300 leading-relaxed">
              <code>{`// Start a workflow run
const res = await fetch("${baseUrl}/api/runs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <your-clerk-session>"
  },
  body: JSON.stringify({
    workflowId: "clx...",
    scope: "full"
  })
});

const { runId } = await res.json();

// Stream results via SSE
const es = new EventSource(
  \`${baseUrl}/api/runs/\${runId}/stream\`
);
es.onmessage = (e) => console.log(JSON.parse(e.data));`}</code>
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
