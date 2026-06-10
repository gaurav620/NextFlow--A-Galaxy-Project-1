"use client";

import { useState, useRef, useEffect } from "react";
import { X, User, Palette, Key, Keyboard, LogOut, Trash2 } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SHORTCUTS = [
  { keys: ["⌘", "Z"], desc: "Undo" },
  { keys: ["⌘", "⇧", "Z"], desc: "Redo" },
  { keys: ["⌘", "+"], desc: "Zoom in" },
  { keys: ["⌘", "–"], desc: "Zoom out" },
  { keys: ["⌘", "0"], desc: "Reset zoom" },
  { keys: ["Delete"], desc: "Delete selected" },
  { keys: ["⌘", "S"], desc: "Save workflow" },
  { keys: ["⌘", "Enter"], desc: "Run workflow" },
];

export function SettingsModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("account");
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme } = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl w-[640px] max-w-[92vw] max-h-[80vh] flex overflow-hidden">
        {/* Left tab nav */}
        <div className="w-[180px] shrink-0 border-r border-neutral-100 dark:border-white/5 py-4 px-3 space-y-0.5">
          <div className="flex items-center justify-between px-2 mb-3">
            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                tab === id
                  ? "bg-neutral-100 dark:bg-white/8 text-neutral-900 dark:text-zinc-100 font-medium"
                  : "text-neutral-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-white/5"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 py-6 px-6 overflow-y-auto">
          {tab === "account" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Account</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-2">Account Information</p>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] text-neutral-600 dark:text-zinc-400">Email</span>
                    <span className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">
                      {user?.primaryEmailAddress?.emailAddress || "—"}
                    </span>
                  </div>
                </div>

                <hr className="border-neutral-100 dark:border-white/5" />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-2">Account Actions</p>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">Sign Out</p>
                      <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Sign out of your account</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 text-[12px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Sign Out <LogOut size={12} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 mt-2">
                    <div>
                      <p className="text-[13px] font-medium text-red-600 dark:text-red-400">Delete Account</p>
                      <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Permanently delete your account and data</p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      Delete <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "preferences" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">Theme</p>
                    <p className="text-[11px] text-neutral-400 dark:text-zinc-500">
                      Current: {theme === "dark" ? "Dark" : "Light"}
                    </p>
                  </div>
                  <ThemeToggle variant="pill" />
                </div>
              </div>
            </div>
          )}

          {tab === "api-keys" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">API Keys</h2>
              <div className="rounded-xl border border-neutral-200 dark:border-white/8 bg-neutral-50 dark:bg-zinc-900/30 p-6 text-center">
                <Key size={24} className="mx-auto text-neutral-300 dark:text-zinc-600 mb-3" />
                <p className="text-[13px] text-neutral-500 dark:text-zinc-400">No API keys configured yet.</p>
                <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-1">
                  API keys are managed through your Gemini and Trigger.dev accounts.
                </p>
              </div>
            </div>
          )}

          {tab === "shortcuts" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Keyboard Shortcuts</h2>
              <div className="space-y-1">
                {SHORTCUTS.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between py-2 px-1">
                    <span className="text-[13px] text-neutral-600 dark:text-zinc-400">{desc}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 text-[11px] font-medium rounded-md border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900 text-neutral-600 dark:text-zinc-300 min-w-[22px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
