"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { createWorkflow } from "@/app/actions/workflows";
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
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/cn";
import { SettingsModal } from "@/components/SettingsModal";

const NAV = [
  { label: "Tasks",     href: "/dashboard",            icon: MessageSquare },
  { label: "Projects",  href: "/dashboard",            icon: FolderOpen },
  { label: "Library",   href: "/dashboard",            icon: LayoutGrid },
  { label: "Flow",      href: "/dashboard",            icon: GitBranch },
  { label: "Nodes",     href: "/dashboard",            icon: Cpu },
  { label: "API / MCP", href: "/dashboard",            icon: Terminal },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname();
  const { user } = useUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const newTaskFormRef = useRef<HTMLFormElement>(null);

  const activeLabel = "Tasks";

  return (
    <>
      <aside
        className={cn(
          "shrink-0 border-r border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-950 flex flex-col min-h-screen transition-all duration-200",
          collapsed ? "w-[48px]" : "w-[160px]"
        )}
      >
        {/* Logo + sidebar toggle */}
        <div className={cn("flex items-center h-12", collapsed ? "justify-center px-2" : "justify-between px-4")}>
          {!collapsed && (
            <Link href="/dashboard">
              <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-zinc-100 hover:opacity-80 transition-opacity cursor-pointer" style={{ fontFamily: "'Georgia', serif" }}>
                NextFlow
              </span>
            </Link>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>

        {/* Action buttons */}
        {!collapsed && (
          <div className="px-3 py-1 space-y-0.5">
            <button
              onClick={() => newTaskFormRef.current?.requestSubmit()}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <Plus size={14} className="text-neutral-400 dark:text-zinc-500" />
              New task
              <span className="ml-auto text-[10px] text-neutral-300 dark:text-zinc-600">⌘OO</span>
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <Search size={14} className="text-neutral-400 dark:text-zinc-500" />
              Search tasks
            </button>
            {searchOpen && (
              <div className="px-1 pt-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
                  className="w-full px-2.5 py-1.5 text-[12px] rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            )}
          </div>
        )}

        {/* Collapsed action buttons */}
        {collapsed && (
          <div className="px-2 py-1 space-y-0.5">
            <button
              onClick={() => newTaskFormRef.current?.requestSubmit()}
              title="New task"
              className="w-full flex items-center justify-center p-2.5 text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <Plus size={14} />
            </button>
            <button
              title="Search tasks"
              className="w-full flex items-center justify-center p-2.5 text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <Search size={14} />
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav className="px-2 py-2 space-y-0.5 flex-1">
          {NAV.map(({ label, href, icon: Icon }) => {
            const isActive = label === activeLabel;
            return (
              <Link
                key={label}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg text-[13px] transition-colors",
                  collapsed ? "justify-center p-2.5" : "px-2.5 py-[7px]",
                  isActive
                    ? "bg-neutral-100 dark:bg-white/8 text-neutral-900 dark:text-zinc-100 font-medium"
                    : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5"
                )}
              >
                <Icon size={15} className={cn("shrink-0", isActive ? "text-neutral-900 dark:text-zinc-100" : "text-neutral-400 dark:text-zinc-500")} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}

          {/* No tasks yet text */}
          {!collapsed && (
            <div className="pt-6 px-2">
              <p className="text-[12px] text-neutral-400 dark:text-zinc-500">No tasks yet</p>
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className={cn("pb-4 space-y-2", collapsed ? "px-2" : "px-3")}>
          {/* Settings — opens modal */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-2 text-[13px] text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-md transition-colors",
              collapsed ? "justify-center p-2.5 w-full" : "w-full px-2 py-1.5"
            )}
          >
            <Settings size={14} />
            {!collapsed && <span>Settings</span>}
          </button>

          {/* Claim Offer button */}
          {!collapsed && (
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[13px] font-semibold hover:from-purple-700 hover:to-purple-600 transition-all shadow-sm active:scale-[0.98]">
              <span className="text-sm">🎁</span>
              Claim Offer
            </button>
          )}

          {/* User profile */}
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

      {/* Hidden form for New Task server action */}
      <form ref={newTaskFormRef} action={createWorkflow} className="hidden" />

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
