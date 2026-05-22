"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, Layers, FolderOpen, Library,
  GitBranch, Cpu, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { label: "Workflows",  href: "/dashboard", icon: Layers,      active: true },
  { label: "Projects",   href: "/dashboard", icon: FolderOpen,  active: false },
  { label: "Library",    href: "/dashboard", icon: Library,      active: false },
  { label: "Flow",       href: "/dashboard", icon: GitBranch,   active: false },
  { label: "Nodes",      href: "/dashboard", icon: Cpu,          active: false },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`shrink-0 border-r border-neutral-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex flex-col transition-all duration-200 ${collapsed ? "w-14" : "w-56"}`}
    >
      {/* Logo + collapse */}
      <div className={`flex items-center border-b border-neutral-100 dark:border-white/5 h-14 ${collapsed ? "justify-center px-2" : "px-4 gap-2.5"}`}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 shadow-sm flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">NF</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-neutral-900 dark:text-zinc-100 tracking-tight text-sm flex-1">NextFlow</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors ${collapsed ? "mt-0" : ""}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
            <Search size={12} className="text-neutral-400 dark:text-zinc-500 shrink-0" />
            <span className="text-xs text-neutral-400 dark:text-zinc-500 select-none">Search workflows…</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 py-2 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {NAV.map(({ label, href, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center rounded-lg transition-colors ${
              collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
            } ${
              active && label === "Workflows"
                ? "bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-zinc-100 font-semibold"
                : "text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-100"
            }`}
            title={collapsed ? label : undefined}
          >
            <Icon size={14} className={active && label === "Workflows" ? "text-purple-600 dark:text-purple-400" : ""} />
            {!collapsed && <span className="text-xs">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom: Settings + User + Theme */}
      <div className={`border-t border-neutral-100 dark:border-white/5 ${collapsed ? "px-2 py-3 flex flex-col gap-2 items-center" : "px-3 py-3"}`}>
        {!collapsed ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-100 transition-colors mb-2"
            >
              <Settings size={14} />
              <span className="text-xs">Settings</span>
            </Link>
            <div className="flex items-center justify-between px-1">
              <UserButton />
              <ThemeToggle />
            </div>
          </>
        ) : (
          <>
            <Link href="/dashboard" title="Settings" className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5">
              <Settings size={14} />
            </Link>
            <UserButton />
            <ThemeToggle />
          </>
        )}
      </div>
    </aside>
  );
}
