"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Upload, RefreshCw, ChevronDown, Grid3X3, List, Heart,
  Sparkles, FolderOpen, SlidersHorizontal, FileText, ArrowUpDown,
  Trash2, Star, Image as ImageIcon, Film, Music, File,
} from "lucide-react";
import { toggleFavorite, deleteMediaFile } from "@/app/actions/media";
import { cn } from "@/lib/cn";

type MediaTab = "All" | "Generated" | "My Uploads" | "Favorites";

interface MediaFileData {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  source: string;
  favorite: boolean;
  createdAt: string;
}

interface FolderData {
  id: string;
  name: string;
  fileCount: number;
}

interface Props {
  files: MediaFileData[];
  folders: FolderData[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  return File;
}

export function LibraryClient({ files, folders }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MediaTab>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const tabs: { label: MediaTab; icon: React.ReactNode }[] = [
    { label: "All", icon: <Grid3X3 size={13} /> },
    { label: "Generated", icon: <Sparkles size={13} /> },
    { label: "My Uploads", icon: <Upload size={13} /> },
    { label: "Favorites", icon: <Heart size={13} /> },
  ];

  const filtered = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "Generated") return matchesSearch && f.source === "generated";
    if (activeTab === "My Uploads") return matchesSearch && f.source === "upload";
    if (activeTab === "Favorites") return matchesSearch && f.favorite;
    return matchesSearch;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("files", selectedFiles[i]);
      }
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      router.refresh();
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggleFavorite = (id: string) => {
    startTransition(async () => {
      await toggleFavorite(id);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this file?")) return;
    startTransition(async () => {
      await deleteMediaFile(id);
      router.refresh();
    });
  };

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-[22px] font-bold text-neutral-900 dark:text-zinc-100">Media Library</h1>
            <p className="text-[13px] text-neutral-400 dark:text-zinc-500">{files.length} file{files.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? "Uploading..." : "Upload Media"}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative my-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search prompts & file names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-900/50 text-[13px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
          <button
            onClick={() => router.refresh()}
            className="p-2 rounded-lg text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Tabs + controls */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1">
            <h2 className="text-[15px] font-bold text-neutral-900 dark:text-zinc-100 mr-4">Your Media</h2>
            {tabs.map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                  activeTab === label
                    ? "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300"
                    : "text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-neutral-200 dark:border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 transition-colors", viewMode === "grid" ? "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-zinc-100" : "text-neutral-400 dark:text-zinc-500")}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 transition-colors", viewMode === "list" ? "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-zinc-100" : "text-neutral-400 dark:text-zinc-500")}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6">
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4">
                  <FileText size={24} className="text-neutral-300 dark:text-zinc-600" />
                </div>
                <p className="text-[14px] font-semibold text-neutral-900 dark:text-zinc-100 mb-1">No assets found</p>
                <p className="text-[13px] text-neutral-400 dark:text-zinc-500 mb-4">Upload files above, or generate content in chat</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-200 dark:border-white/10 text-[13px] font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Upload size={13} /> Upload files
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filtered.map((f) => {
                  const Icon = getFileIcon(f.mimeType);
                  return (
                    <div key={f.id} className="rounded-xl border border-neutral-200 dark:border-white/8 bg-white dark:bg-zinc-900/30 overflow-hidden hover:shadow-md hover:border-neutral-300 dark:hover:border-white/15 transition-all group relative">
                      {/* Preview */}
                      {f.mimeType.startsWith("image/") ? (
                        <div className="h-[120px] bg-neutral-100 dark:bg-zinc-800">
                          <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-[120px] bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Icon size={32} className="text-neutral-300 dark:text-zinc-600" />
                        </div>
                      )}
                      {/* Info */}
                      <div className="px-3 py-2.5">
                        <p className="text-[12px] font-medium text-neutral-900 dark:text-zinc-100 truncate">{f.name}</p>
                        <p className="text-[11px] text-neutral-400 dark:text-zinc-500">{formatSize(f.size)}</p>
                      </div>
                      {/* Hover actions */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleFavorite(f.id)}
                          className={cn("p-1 rounded-md bg-white/80 dark:bg-zinc-900/80 transition-colors", f.favorite ? "text-yellow-500" : "text-neutral-400 hover:text-yellow-500")}
                        >
                          <Star size={12} fill={f.favorite ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1 rounded-md bg-white/80 dark:bg-zinc-900/80 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((f) => {
                  const Icon = getFileIcon(f.mimeType);
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group">
                      <Icon size={16} className="text-neutral-400 dark:text-zinc-500 shrink-0" />
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-zinc-100 flex-1 truncate">{f.name}</p>
                      <span className="text-[12px] text-neutral-400 dark:text-zinc-500">{formatSize(f.size)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleFavorite(f.id)} className={cn("p-1 rounded-md", f.favorite ? "text-yellow-500" : "text-neutral-400 hover:text-yellow-500")}>
                          <Star size={12} fill={f.favorite ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="p-1 rounded-md text-neutral-400 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Folders panel */}
          <div className="w-[140px] shrink-0 hidden lg:block">
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-medium text-neutral-900 dark:text-zinc-100 mb-1">
              <Grid3X3 size={12} /> All
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-neutral-500 dark:text-zinc-400">
              <FolderOpen size={12} /> My Folders
            </div>
            {folders.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5 px-4 py-1 text-[11px] text-neutral-400 dark:text-zinc-500">
                <FolderOpen size={10} /> {f.name} ({f.fileCount})
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
