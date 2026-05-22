"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Play, Clock, Download, Upload, Loader2, Timer, Coins } from "lucide-react";
import { useCanvas, type FlowNode, type FlowEdge } from "@/stores/canvas";
import { useRun } from "@/lib/use-run";
import { UserButton } from "@clerk/nextjs";

interface Props {
  workflowId: string;
  onToggleHistory: () => void;
}

export function CanvasTopBar({ workflowId, onToggleHistory }: Props) {
  const name = useCanvas((s) => s.name);
  const setName = useCanvas((s) => s.setName);
  const selectedIds = useCanvas((s) => s.selectedIds);
  const [editing, setEditing] = useState(false);
  const { running, run } = useRun(workflowId);

  const handleRun = () => {
    if (selectedIds.size > 1) {
      run("partial", Array.from(selectedIds));
    } else {
      run("full");
    }
  };

  const exportJson = () => {
    const state = useCanvas.getState();
    const blob = new Blob(
      [JSON.stringify({ version: 1, name: state.name, nodes: state.nodes, edges: state.edges }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.name || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const raw = JSON.parse(text);
        const { WorkflowGraphSchema } = await import("@/lib/types");
        const result = WorkflowGraphSchema.safeParse(raw);
        if (!result.success) {
          const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
          alert(`Invalid workflow file:\n${issues}`);
          return;
        }
        useCanvas.getState().loadGraph(result.data.nodes as FlowNode[], result.data.edges as FlowEdge[]);
        if (raw.name) setName(raw.name);
      } catch {
        alert("Invalid workflow file — could not parse JSON");
      }
    };
    inp.click();
  };

  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 backdrop-blur-md text-white shrink-0">
      {/* Left: back + name */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
          title="Back to workflows"
        >
          <ArrowLeft size={15} />
        </Link>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") setEditing(false);
            }}
            className="text-sm font-semibold px-2 py-1 border border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/30 bg-zinc-900 text-white max-w-48"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold px-2 py-1 rounded-md hover:bg-white/10 text-zinc-100 truncate max-w-48"
            title="Click to rename"
          >
            {name}
          </button>
        )}
      </div>

      {/* Right: pills + actions + run */}
      <div className="flex items-center gap-1.5">
        {/* Est / Bal pills — Magica style */}
        <div className="hidden md:flex items-center gap-1.5 mr-1">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/5 bg-zinc-900/50 text-xs text-zinc-400">
            <Timer size={11} className="text-zinc-500" />
            <span>Est 0.01 M</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/5 bg-zinc-900/50 text-xs text-zinc-400">
            <Coins size={11} className="text-zinc-500" />
            <span>Bal 30.33 M</span>
          </div>
        </div>

        {/* Import */}
        <button
          onClick={importJson}
          className="p-2 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Import JSON"
        >
          <Upload size={15} />
        </button>

        {/* Export */}
        <button
          onClick={exportJson}
          className="p-2 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Export JSON"
        >
          <Download size={15} />
        </button>

        {/* History */}
        <button
          onClick={onToggleHistory}
          className="p-2 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Execution History"
        >
          <Clock size={15} />
        </button>

        {/* Run button — Magica style: bigger, purple, icon */}
        <button
          onClick={handleRun}
          disabled={running}
          className="ml-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition-all shadow-sm hover:shadow-md active:scale-95"
          title={selectedIds.size > 1 ? "Run selected nodes" : "Run workflow"}
        >
          {running ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
          {!running && (
            <span className="hidden md:inline">
              {selectedIds.size > 1 ? "Run Selection" : "Run"}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Clerk User Button */}
        <div className="flex items-center justify-center p-0.5 rounded-full hover:bg-white/10 transition-colors">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
