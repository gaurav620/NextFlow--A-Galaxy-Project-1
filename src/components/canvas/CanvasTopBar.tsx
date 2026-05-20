"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Play, History, Download, Upload, Loader2 } from "lucide-react";
import { useCanvas, type FlowNode, type FlowEdge } from "@/stores/canvas";
import { useRun } from "@/lib/use-run";

interface Props {
  workflowId: string;
  onToggleHistory: () => void;
}

export function CanvasTopBar({ workflowId, onToggleHistory }: Props) {
  const name = useCanvas((s) => s.name);
  const setName = useCanvas((s) => s.setName);
  const [editing, setEditing] = useState(false);
  const { running, run } = useRun(workflowId);

  const exportJson = () => {
    const state = useCanvas.getState();
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            name: state.name,
            nodes: state.nodes,
            edges: state.edges,
          },
          null,
          2
        ),
      ],
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
        // Zod validation
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
    <header className="h-14 px-4 flex items-center justify-between border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-md hover:bg-neutral-100"
          title="Back to workflows"
        >
          <ArrowLeft size={16} />
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
            className="text-sm font-medium px-2 py-1 border border-neutral-300 rounded-md focus:outline-none focus:border-purple-500"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium px-2 py-1 rounded-md hover:bg-neutral-100"
          >
            {name}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="hidden md:flex items-center gap-2 mr-2">
          <span className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700">
            Est 0.01 M
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700">
            Bal 30.33 M
          </span>
        </div>
        <button
          onClick={importJson}
          className="p-2 rounded-md hover:bg-neutral-100"
          title="Import JSON"
        >
          <Upload size={15} />
        </button>
        <button
          onClick={exportJson}
          className="p-2 rounded-md hover:bg-neutral-100"
          title="Export JSON"
        >
          <Download size={15} />
        </button>
        <button
          onClick={onToggleHistory}
          className="p-2 rounded-md hover:bg-neutral-100"
          title="History"
        >
          <History size={15} />
        </button>
        <button
          onClick={() => run("full")}
          disabled={running}
          className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-60"
          title="Run"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
        </button>
      </div>
    </header>
  );
}
