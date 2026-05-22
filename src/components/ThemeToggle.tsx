"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/cn";

interface Props {
  /** Visual variant */
  variant?: "icon" | "pill";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "relative flex items-center w-14 h-7 rounded-full p-0.5 transition-colors duration-300",
          isDark
            ? "bg-purple-600/20 border border-purple-500/30"
            : "bg-neutral-200 border border-neutral-300",
          className
        )}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label="Toggle theme"
      >
        {/* Sliding circle */}
        <span
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-all duration-300",
            isDark
              ? "translate-x-[26px] bg-purple-500"
              : "translate-x-0 bg-white"
          )}
        >
          {isDark ? (
            <Moon size={12} className="text-white" />
          ) : (
            <Sun size={12} className="text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-all duration-200 group",
        isDark
          ? "hover:bg-white/10 text-zinc-400 hover:text-amber-300"
          : "hover:bg-neutral-100 text-neutral-500 hover:text-purple-600",
        className
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      <div className="relative w-[18px] h-[18px]">
        {/* Sun icon — visible in dark mode (to switch to light) */}
        <Sun
          size={18}
          className={cn(
            "absolute inset-0 transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
        {/* Moon icon — visible in light mode (to switch to dark) */}
        <Moon
          size={18}
          className={cn(
            "absolute inset-0 transition-all duration-300",
            isDark
              ? "-rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
      </div>
    </button>
  );
}
