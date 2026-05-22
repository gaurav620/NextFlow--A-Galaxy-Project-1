"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

export function DashboardSidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-neutral-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5 border-b border-neutral-100 dark:border-white/5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 shadow-sm flex items-center justify-center">
          <span className="text-white text-xs font-bold">N</span>
        </div>
        <span className="font-bold text-neutral-900 dark:text-zinc-100 tracking-tight text-sm">NextFlow</span>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1 space-y-0.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-white/5 text-xs font-semibold text-neutral-900 dark:text-zinc-100"
        >
          <Layers size={14} className="text-purple-600 dark:text-purple-400" />
          Workflows
        </Link>
      </nav>

      {/* User + Theme */}
      <div className="p-4 border-t border-neutral-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <UserButton />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
