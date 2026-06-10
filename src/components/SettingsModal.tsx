"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, User, Settings2, CreditCard, Palette, UserCog, Brain,
  Plug, Key, FolderOpen, Keyboard, LogOut, Trash2, Search,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TABS = [
  { id: "account",         label: "Account",         icon: User },
  { id: "general",         label: "General",         icon: Settings2 },
  { id: "billing",         label: "Billing",         icon: CreditCard },
  { id: "preferences",     label: "Preferences",     icon: Palette },
  { id: "personalization", label: "Personalization",  icon: UserCog },
  { id: "memory",          label: "Memory",          icon: Brain },
  { id: "integrations",    label: "Integrations",    icon: Plug },
  { id: "api-keys",        label: "API Keys",        icon: Key },
  { id: "resources",       label: "Resources",       icon: FolderOpen },
  { id: "shortcuts",       label: "Shortcuts",       icon: Keyboard },
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

const INTEGRATIONS = [
  { name: "Gmail", icon: "📧", desc: "Gmail is Google's email service, featuring spam protection, search..." },
  { name: "GitHub", icon: "🐙", desc: "GitHub is a code hosting platform for version control and collaboration..." },
  { name: "Google Calendar", icon: "📅", desc: "Google Calendar is a time management tool providing..." },
  { name: "Notion", icon: "📝", desc: "Notion centralizes notes, docs, wikis, and tasks in a unified workspace..." },
  { name: "Google Sheets", icon: "📊", desc: "Google Sheets is a cloud-based spreadsheet tool enabling real-time..." },
  { name: "Slack", icon: "💬", desc: "Slack is a channel-based messaging platform. With Slack, people can wor..." },
];

export function SettingsModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("account");
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme } = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [integrationSearch, setIntegrationSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const filteredIntegrations = INTEGRATIONS.filter((i) =>
    i.name.toLowerCase().includes(integrationSearch.toLowerCase())
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl w-[700px] max-w-[92vw] max-h-[80vh] flex overflow-hidden">
        {/* Left tab nav */}
        <div className="w-[180px] shrink-0 border-r border-neutral-100 dark:border-white/5 py-4 px-3 space-y-0.5 overflow-y-auto">
          <div className="flex items-center px-2 mb-3">
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

          {/* ── Account ── */}
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
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-2">Organization</p>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">Create Organization</p>
                      <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Start collaborating with your team</p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 text-[12px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                      Create
                    </button>
                  </div>
                </div>
                <hr className="border-neutral-100 dark:border-white/5" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-2">Account Actions</p>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">Password</p>
                      <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Change your account password</p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 text-[12px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                      Change 🔑
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 mt-1">
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
                  <div className="flex items-center justify-between py-2 mt-1">
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

          {/* ── General ── */}
          {tab === "general" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">General</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">Language</p>
                    <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Interface language</p>
                  </div>
                  <select className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-[12px] text-neutral-700 dark:text-zinc-300">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">Notifications</p>
                    <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Receive email notifications</p>
                  </div>
                  <button className="w-10 h-5 rounded-full bg-purple-500 relative transition-colors">
                    <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Billing ── */}
          {tab === "billing" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Billing</h2>
              <div className="rounded-xl border border-neutral-200 dark:border-white/8 bg-neutral-50 dark:bg-zinc-900/30 p-6">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100 mb-1">Free Plan</p>
                <p className="text-[12px] text-neutral-400 dark:text-zinc-500 mb-4">You're currently on the free tier.</p>
                <button className="px-4 py-2 rounded-lg bg-purple-600 text-white text-[13px] font-semibold hover:bg-purple-700 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}

          {/* ── Preferences ── */}
          {tab === "preferences" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Preferences</h2>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">Theme</p>
                  <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Current: {theme === "dark" ? "Dark" : "Light"}</p>
                </div>
                <ThemeToggle variant="pill" />
              </div>
            </div>
          )}

          {/* ── Personalization ── */}
          {tab === "personalization" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Personalization</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100 block mb-2">Custom Instructions</label>
                  <textarea
                    placeholder="Tell the AI about your preferences, writing style, etc."
                    className="w-full h-24 px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Memory ── */}
          {tab === "memory" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Memory</h2>
              <div className="rounded-xl border border-neutral-200 dark:border-white/8 bg-neutral-50 dark:bg-zinc-900/30 p-6 text-center">
                <Brain size={24} className="mx-auto text-neutral-300 dark:text-zinc-600 mb-3" />
                <p className="text-[13px] text-neutral-500 dark:text-zinc-400">No memories stored yet.</p>
                <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-1">The AI will remember important context from your conversations.</p>
              </div>
            </div>
          )}

          {/* ── Integrations ── (MAGICA STYLE) */}
          {tab === "integrations" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Integrations</h2>
              {/* Search */}
              <div className="relative mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={integrationSearch}
                  onChange={(e) => setIntegrationSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-3">Available Apps</p>
              <div className="grid grid-cols-2 gap-3">
                {filteredIntegrations.map((app) => (
                  <div key={app.name} className="rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{app.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-zinc-100">{app.name}</p>
                        <p className="text-[11px] text-neutral-400 dark:text-zinc-500 line-clamp-2">{app.desc}</p>
                      </div>
                    </div>
                    <button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 text-[12px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                      <Plug size={11} /> Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── API Keys ── */}
          {tab === "api-keys" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">API Keys</h2>
              <div className="rounded-xl border border-neutral-200 dark:border-white/8 bg-neutral-50 dark:bg-zinc-900/30 p-6 text-center">
                <Key size={24} className="mx-auto text-neutral-300 dark:text-zinc-600 mb-3" />
                <p className="text-[13px] text-neutral-500 dark:text-zinc-400">No API keys configured yet.</p>
                <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-1">API keys are managed through your Gemini and Trigger.dev accounts.</p>
              </div>
            </div>
          )}

          {/* ── Resources ── */}
          {tab === "resources" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Resources</h2>
              <div className="space-y-2">
                {[
                  { label: "Documentation", desc: "Learn how to build workflows" },
                  { label: "API Reference", desc: "REST API endpoints and schemas" },
                  { label: "Community", desc: "Join the NextFlow community" },
                ].map((r) => (
                  <button key={r.label} className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-white/8 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors text-left">
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100">{r.label}</p>
                      <p className="text-[11px] text-neutral-400 dark:text-zinc-500">{r.desc}</p>
                    </div>
                    <span className="text-neutral-300 dark:text-zinc-600">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Shortcuts ── */}
          {tab === "shortcuts" && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 mb-5">Keyboard Shortcuts</h2>
              <div className="space-y-1">
                {SHORTCUTS.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between py-2 px-1">
                    <span className="text-[13px] text-neutral-600 dark:text-zinc-400">{desc}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k) => (
                        <kbd key={k} className="px-1.5 py-0.5 text-[11px] font-medium rounded-md border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900 text-neutral-600 dark:text-zinc-300 min-w-[22px] text-center">
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
