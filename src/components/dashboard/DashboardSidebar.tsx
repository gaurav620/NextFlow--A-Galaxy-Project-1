"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, Plus, Layers, FolderOpen, Library,
  GitBranch, Cpu, Settings, ChevronLeft, ChevronRight,
  PenLine,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Tasks",     href: "/dashboard", icon: Layers },
  { label: "Projects",  href: "/dashboard", icon: FolderOpen },
  { label: "Library",   href: "/dashboard", icon: Library },
  { label: "Flow",      href: "/dashboard", icon: GitBranch },
  { label: "Nodes",     href: "/dashboard", icon: Cpu },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "shrink-0 border-r flex flex-col transition-all duration-200",
        "border-neutral-200 dark:border-white/5 bg-white dark:bg-zinc-950",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo + collapse */}
      <div className={cn(
        "flex items-center border-b border-neutral-100 dark:border-white/5 h-14",
        collapsed ? "justify-center px-2" : "px-4 gap-2.5"
      )}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-amber-400 shadow-sm flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-extrabold leading-none">NF</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-neutral-900 dark:text-zinc-100 tracking-tight text-sm flex-1">NextFlow</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Action buttons — Magica style */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 space-y-1">
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
            <Plus size={13} />
            <span>New task</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
            <Search size={13} />
            <span>Search tasks</span>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className={cn("flex-1 py-2 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex items-center rounded-lg transition-colors text-xs",
              collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2",
              label === "Tasks"
                ? "bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-zinc-100 font-semibold"
                : "text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-100"
            )}
            title={collapsed ? label : undefined}
          >
            <Icon size={14} className={label === "Tasks" ? "text-purple-600 dark:text-purple-400" : ""} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom section — Magica style */}
      <div className={cn(
        "border-t border-neutral-100 dark:border-white/5",
        collapsed ? "px-2 py-3 flex flex-col gap-2 items-center" : "px-3 py-3 space-y-2"
      )}>
        {!collapsed ? (
          <>
            {/* Settings */}
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-100 transition-colors text-xs">
              <Settings size={14} />
              <span>Settings</span>
            </button>

            {/* Theme toggle row */}
            <div className="flex items-center gap-1 px-2">
              <ThemeToggle />
            </div>

            {/* User profile */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/3">
              <UserButton />
              {user && (
                <div className="min-w-0 flex-1 leading-none">
                  <p className="text-[10px] font-semibold text-neutral-700 dark:text-zinc-300 truncate">
                    {user.fullName || user.username || "User"}
                  </p>
                  <p className="text-[8px] text-neutral-400 dark:text-zinc-500 truncate mt-0.5">
                    {user.primaryEmailAddress?.emailAddress || ""}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button title="Settings" className="p-2 rounded-lg text-neutral-400 dark:text-zinc-500 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
              <Settings size={14} />
            </button>
            <ThemeToggle />
            <UserButton />
          </>
        )}
      </div>
    </aside>
  );
}
