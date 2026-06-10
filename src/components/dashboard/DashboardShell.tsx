"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ChatInterface } from "@/components/dashboard/ChatInterface";
import { WorkflowRow } from "@/components/dashboard/WorkflowRow";

interface WorkflowData {
  id: string;
  name: string;
  updatedAt: string;
  graph: { nodes?: { type: string }[] };
}

interface Props {
  workflows: WorkflowData[];
  createWorkflowAction: () => void;
  createSampleWorkflowAction: () => void;
}

export function DashboardShell({ workflows, createWorkflowAction, createSampleWorkflowAction }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#08080a]">
      {/* Collapsible sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content — always show chat interface */}
      <ChatInterface />
    </div>
  );
}
