"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Tasks",     href: "/dashboard",   icon: MessageSquare },
  { label: "Projects",  href: "/dashboard",   icon: FolderOpen },
  { label: "Library",   href: "/dashboard",   icon: LayoutGrid },
  { label: "Flow",      href: "/dashboard",   icon: GitBranch },
  { label: "Nodes",     href: "/dashboard",   icon: Cpu },
  { label: "API / MCP", href: "/dashboard",   icon: Terminal },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="w-[160px] shrink-0 border-r border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-950 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-zinc-100" style={{ fontFamily: "'Georgia', serif" }}>
          NextFlow
        </span>
      </div>

      {/* Action buttons */}
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

      {/* Nav items */}
      <nav className="px-2 py-2 space-y-0.5 flex-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const isActive = label === "Tasks"; // Default active
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors",
                isActive
                  ? "bg-neutral-100 dark:bg-white/8 text-neutral-900 dark:text-zinc-100 font-medium"
                  : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5"
              )}
            >
              <Icon size={15} className={isActive ? "text-neutral-900 dark:text-zinc-100" : "text-neutral-400 dark:text-zinc-500"} />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* No tasks yet text */}
        <div className="pt-6 px-2">
          <p className="text-[12px] text-neutral-400 dark:text-zinc-500">No tasks yet</p>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2">
        {/* Settings */}
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-md transition-colors">
          <Settings size={14} />
          Settings
        </button>

        {/* Claim Offer button — Magica style */}
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[13px] font-semibold hover:from-purple-700 hover:to-purple-600 transition-all shadow-sm">
          <span className="text-sm">🎁</span>
          Claim Offer
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 px-1 py-1">
          <UserButton />
          {user && (
            <span className="text-[12px] font-medium text-neutral-700 dark:text-zinc-300 truncate">
              {user.fullName || user.username || "User"}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
