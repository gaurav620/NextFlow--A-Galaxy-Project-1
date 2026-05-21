"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  Network,
  GitBranch,
  Settings,
  Cpu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { UserButton, useUser } from "@clerk/nextjs";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { icon: Home, label: "Tasks", href: "/dashboard" },
  { icon: Network, label: "Projects", href: "/dashboard" },
  { icon: LayoutGrid, label: "Library", href: "#" },
  { icon: GitBranch, label: "Flow", href: "#" },
  { icon: Cpu, label: "Nodes", href: "#" },
];

export function CanvasSidebar({ collapsed, onToggle }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-white border-r border-neutral-200 transition-all duration-200 z-20 shrink-0",
        collapsed ? "w-12" : "w-52"
      )}
    >
      {/* Logo row */}
      <div className="h-14 flex items-center px-3 border-b border-neutral-200 gap-2 overflow-hidden">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center shrink-0">
              <GitBranch size={13} className="text-white" />
            </div>
            <span className="font-bold text-sm truncate text-neutral-900">NextFlow</span>
          </div>
        )}
        {collapsed && (
          <div className="w-6 h-6 mx-auto rounded-md bg-purple-600 flex items-center justify-center">
            <GitBranch size={13} className="text-white" />
          </div>
        )}
      </div>

      {/* Toggle button (floating on border) */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[52px] w-6 h-6 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-500 hover:bg-neutral-50 shadow-sm z-30 transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-neutral-100">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-neutral-50 hover:bg-neutral-100 text-xs text-neutral-400 transition-colors"
          >
            <Search size={12} />
            <span>Search…</span>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors",
              collapsed && "justify-center px-1.5"
            )}
          >
            <Icon size={14} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom: Settings & Profile */}
      <div className="px-1.5 py-2 border-t border-neutral-100 space-y-1.5">
        <button
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors",
            collapsed && "justify-center px-1.5"
          )}
        >
          <Settings size={14} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        <div className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md border border-neutral-100 bg-neutral-50/50",
          collapsed && "justify-center px-0 bg-transparent border-0"
        )}>
          <div className="shrink-0 flex items-center justify-center">
            <UserButton />
          </div>
          {!collapsed && user && (
            <div className="min-w-0 flex-1 leading-none">
              <p className="text-[10px] font-semibold text-neutral-700 truncate">
                {user.fullName || user.username || "User"}
              </p>
              <p className="text-[8px] text-neutral-400 truncate mt-0.5">
                {user.primaryEmailAddress?.emailAddress || ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
