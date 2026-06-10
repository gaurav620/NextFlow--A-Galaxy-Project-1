"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  MessageSquare,
  FolderOpen,
  LayoutGrid,
  GitBranch,
  Cpu,
  Terminal,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { UserButton, useUser } from "@clerk/nextjs";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { icon: MessageSquare, label: "Tasks", href: "/dashboard" },
  { icon: FolderOpen, label: "Projects", href: "/dashboard" },
  { icon: LayoutGrid, label: "Library", href: "#" },
  { icon: GitBranch, label: "Flow", href: "#" },
  { icon: Cpu, label: "Nodes", href: "#" },
  { icon: Terminal, label: "API / MCP", href: "#" },
];

export function CanvasSidebar({ collapsed, onToggle }: Props) {
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r transition-all duration-200 z-20 shrink-0",
        "bg-white border-neutral-200 dark:bg-zinc-950 dark:border-white/8",
        collapsed ? "w-[48px]" : "w-[160px]"
      )}
    >
      {/* Logo row */}
      <div className={cn("flex items-center h-12", collapsed ? "justify-center px-2" : "px-4 gap-2")}>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-zinc-100 flex-1" style={{ fontFamily: "'Georgia', serif" }}>
            NextFlow
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Actions */}
      {!collapsed && (
        <div className="px-3 py-1 space-y-0.5">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors">
            <Plus size={14} className="text-neutral-400 dark:text-zinc-500" />
            New task
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors">
            <Search size={14} className="text-neutral-400 dark:text-zinc-500" />
            Search tasks
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg transition-colors text-[13px]",
              collapsed ? "justify-center p-2.5" : "px-2.5 py-[7px]",
              "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5"
            )}
          >
            <Icon size={15} className="text-neutral-400 dark:text-zinc-500 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* No tasks yet */}
        {!collapsed && (
          <div className="pt-6 px-2">
            <p className="text-[12px] text-neutral-400 dark:text-zinc-500">No tasks yet</p>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className={cn("pb-4 space-y-2", collapsed ? "px-2" : "px-3")}>
        {/* Settings */}
        <button
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-2 text-[13px] text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-md transition-colors",
            collapsed ? "justify-center p-2.5 w-full" : "w-full px-2 py-1.5"
          )}
        >
          <Settings size={14} />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* Claim Offer */}
        {!collapsed && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[13px] font-semibold hover:from-purple-700 hover:to-purple-600 transition-all shadow-sm">
            <span className="text-sm">🎁</span>
            Claim Offer
          </button>
        )}

        {/* User */}
        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "px-1 py-1")}>
          <UserButton />
          {!collapsed && user && (
            <span className="text-[12px] font-medium text-neutral-700 dark:text-zinc-300 truncate">
              {user.fullName || user.username || "User"}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
