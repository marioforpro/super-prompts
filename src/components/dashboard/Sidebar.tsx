"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/icons/Logo";
import { useDashboard } from "@/contexts/DashboardContext";
import { createFolder, deleteFolder, renameFolder, updateFolder as updateFolderAction } from "@/lib/actions/folders";
import { signOut } from "@/lib/actions/auth";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Curated model list with unique colors, in display order
const SIDEBAR_MODELS: { slug: string; name: string; color: string }[] = [
  { slug: "nano-banana-pro", name: "Nano Banana Pro", color: "#facc15" },
  { slug: "flux",            name: "FLUX",            color: "#38bdf8" },
  { slug: "kling",           name: "Kling",           color: "#a78bfa" },
  { slug: "midjourney",      name: "Midjourney",      color: "#f87171" },
  { slug: "sora",            name: "Sora",            color: "#34d399" },
  { slug: "veo",             name: "VEO",             color: "#60a5fa" },
  { slug: "seedance",        name: "Seedance",        color: "#fb923c" },
  { slug: "seedream",        name: "Seedream",        color: "#e879f9" },
  { slug: "suno",            name: "Suno",            color: "#2dd4bf" },
  { slug: "chatgpt",         name: "ChatGPT",         color: "#4ade80" },
  { slug: "claude",          name: "Claude",          color: "#d4a574" },
];

// Preset folder colors
const FOLDER_COLORS = [
  '#e8764b', '#f87171', '#facc15', '#34d399',
  '#38bdf8', '#a78bfa', '#e879f9', '#fb923c',
  '#2dd4bf', '#f0eff2'
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    folders,
    addFolder,
    removeFolder,
    updateFolder,
    models: _models,
    tags,
    selectedFolderId,
    setSelectedFolderId,
    selectedModelSlug,
    setSelectedModelSlug,
    selectedTag,
    setSelectedTag,
    showFavoritesOnly,
    setShowFavoritesOnly,
  } = useDashboard();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Folder management
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const editFolderInputRef = useRef<HTMLInputElement>(null);

  // Folder sort mode
  const [folderSortMode, setFolderSortMode] = useState<'custom' | 'name'>('custom');

  // Focus input when creating folder
  useEffect(() => {
    if (isCreatingFolder && folderInputRef.current) {
      folderInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  // Focus input when renaming folder
  useEffect(() => {
    if (editingFolderId && editFolderInputRef.current) {
      editFolderInputRef.current.focus();
      editFolderInputRef.current.select();
    }
  }, [editingFolderId]);

  // Close folder context menu on outside click
  const folderMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!folderMenuId && !colorPickerId) return;
    const handleClick = (e: MouseEvent) => {
      if (folderMenuRef.current && folderMenuRef.current.contains(e.target as Node)) return;
      if (colorPickerRef.current && colorPickerRef.current.contains(e.target as Node)) return;
      setFolderMenuId(null);
      setColorPickerId(null);
    };
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [folderMenuId, colorPickerId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setIsCreatingFolder(false);
      setNewFolderName("");
      return;
    }
    setFolderError("");
    try {
      const folder = await createFolder(newFolderName.trim());
      addFolder(folder);
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolderId || !editingFolderName.trim()) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }
    try {
      const updated = await renameFolder(editingFolderId, editingFolderName.trim());
      updateFolder(editingFolderId, { name: updated.name });
      setEditingFolderId(null);
      setEditingFolderName("");
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to rename folder");
      setEditingFolderId(null);
    }
  };

  const handleDeleteFolderAction = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      removeFolder(folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to delete folder");
    }
    setFolderMenuId(null);
  };

  const handleFolderColorChange = async (folderId: string, newColor: string) => {
    try {
      updateFolder(folderId, { color: newColor });
      await updateFolderAction(folderId, { color: newColor });
      setColorPickerId(null);
      setFolderMenuId(null);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to update folder color");
    }
  };

  const handleFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateFolder();
    } else if (e.key === "Escape") {
      setIsCreatingFolder(false);
      setNewFolderName("");
      setFolderError("");
    }
  };

  const handleNavClick = (action: () => void) => {
    action();
    if (window.innerWidth < 768) onClose();
  };

  const isAllActive =
    !selectedFolderId && !selectedModelSlug && !selectedTag && !showFavoritesOnly;

  // Sort folders based on mode
  const sortedFolders = [...folders].sort((a, b) => {
    if (folderSortMode === 'name') {
      return a.name.localeCompare(b.name);
    }
    // custom mode: keep original order (sort_order from DB)
    return 0;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-surface z-50 border-r border-surface-200 transition-transform duration-300 transform md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-100 md:hidden"
        >
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 py-4 border-b border-surface-200">
            <Link href="/dashboard">
              <Logo size="sm" showText={true} />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
            {/* All Prompts */}
            <button
              onClick={() =>
                handleNavClick(() => {
                  setSelectedFolderId(null);
                  setSelectedModelSlug(null);
                  setSelectedTag(null);
                  setShowFavoritesOnly(false);
                })
              }
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                isAllActive
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "text-text-muted hover:text-foreground hover:bg-surface-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-sm font-medium">All Prompts</span>
            </button>

            {/* Favorites */}
            <button
              onClick={() =>
                handleNavClick(() => {
                  setSelectedFolderId(null);
                  setSelectedModelSlug(null);
                  setSelectedTag(null);
                  setShowFavoritesOnly(true);
                })
              }
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                showFavoritesOnly
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "text-text-muted hover:text-foreground hover:bg-surface-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-medium">Favorites</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-surface-200 my-4" />

            {/* FOLDERS */}
            <div>
              {/* Folders header with sort and add buttons */}
              <div className="flex items-center justify-between px-4 py-2 gap-2">
                <span className="text-xs font-bold tracking-widest text-text-dim uppercase flex-1" style={{ fontFamily: "var(--font-mono)" }}>
                  Folders
                </span>
                <button
                  onClick={() => setFolderSortMode(folderSortMode === 'custom' ? 'name' : 'custom')}
                  className="p-1 hover:bg-surface-100 rounded transition-colors cursor-pointer"
                  title={`Sort: ${folderSortMode === 'custom' ? 'Custom' : 'Name'}`}
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 8a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 8a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm10-13a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 01-1 1h-5a1 1 0 01-1-1V4zm0 8a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 01-1 1h-5a1 1 0 01-1-1v-2zm0 8a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 01-1 1h-5a1 1 0 01-1-1v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsCreatingFolder(true);
                    setFolderError("");
                  }}
                  className="p-1 hover:bg-surface-100 rounded transition-colors cursor-pointer"
                  title="Create folder"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Inline folder creation */}
              {isCreatingFolder && (
                <div className="px-4 mt-1 mb-1">
                  <input
                    ref={folderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={handleFolderKeyDown}
                    onBlur={handleCreateFolder}
                    placeholder="Folder name..."
                    className="w-full px-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
                  />
                  {folderError && (
                    <p className="text-xs text-red-400 mt-1">{folderError}</p>
                  )}
                </div>
              )}

              <div className="mt-1 space-y-0.5 pl-2">
                {sortedFolders.length === 0 && !isCreatingFolder ? (
                  <p className="px-4 py-2 text-xs text-text-dim">No folders yet</p>
                ) : (
                  sortedFolders.map((folder) => (
                    <div key={folder.id} className="relative group">
                      {editingFolderId === folder.id ? (
                        <div className="px-4 py-1">
                          <input
                            ref={editFolderInputRef}
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); handleRenameFolder(); }
                              else if (e.key === "Escape") { setEditingFolderId(null); setEditingFolderName(""); }
                            }}
                            onBlur={handleRenameFolder}
                            className="w-full px-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleNavClick(() => {
                              setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id);
                              setShowFavoritesOnly(false);
                            })
                          }
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
                          }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-lg transition-all duration-150 cursor-pointer ${
                            selectedFolderId === folder.id
                              ? "bg-surface-200 text-foreground"
                              : "text-text-muted hover:text-foreground hover:bg-surface-100"
                          }`}
                        >
                          {/* Folder SVG icon with dynamic color */}
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: folder.color || "#e8764b" }}>
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-6L9.172 1.172A2 2 0 007.757 1H4z" />
                          </svg>
                          <span className="truncate flex-1 text-left">{folder.name}</span>
                          {/* Three-dot menu button - visible on hover */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-surface-200 rounded"
                          >
                            <svg className="w-4 h-4 text-text-dim" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </span>
                        </button>
                      )}

                      {/* Context menu */}
                      {folderMenuId === folder.id && (
                        <div
                          ref={folderMenuRef}
                          className="absolute left-8 top-full z-50 mt-1 w-40 bg-surface-100 border border-surface-200 rounded-lg shadow-xl overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                              setFolderMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200 transition-colors cursor-pointer"
                          >
                            Rename
                          </button>
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              setColorPickerId(folder.id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200 transition-colors cursor-pointer"
                          >
                            Change color
                          </button>
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              handleDeleteFolderAction(folder.id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-surface-200 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {/* Color picker */}
                      {colorPickerId === folder.id && (
                        <div
                          ref={colorPickerRef}
                          className="absolute left-8 top-full z-50 mt-1 p-3 bg-surface-100 border border-surface-200 rounded-lg shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="grid grid-cols-5 gap-2">
                            {FOLDER_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFolderColorChange(folder.id, color);
                                }}
                                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer"
                                style={{
                                  backgroundColor: color,
                                  borderColor: folder.color === color ? '#ffffff' : 'transparent'
                                }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-surface-200 my-4" />

            {/* AI MODELS */}
            <div>
              <div className="px-4 py-2">
                <span className="text-xs font-bold tracking-widest text-text-dim uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                  AI Models
                </span>
              </div>
              <div className="mt-1 space-y-0.5 pl-2">
                {SIDEBAR_MODELS.map((model) => (
                  <button
                    key={model.slug}
                    onClick={() =>
                      handleNavClick(() => {
                        setSelectedModelSlug(selectedModelSlug === model.slug ? null : model.slug);
                        setShowFavoritesOnly(false);
                      })
                    }
                    className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-xs rounded-lg transition-all duration-150 cursor-pointer ${
                      selectedModelSlug === model.slug
                        ? "bg-surface-200 text-foreground"
                        : "text-text-muted hover:text-foreground hover:bg-surface-100"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: model.color }}
                    />
                    <span className="truncate">{model.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-surface-200 my-4" />

            {/* TAGS */}
            <div>
              <div className="px-4 py-2">
                <span className="text-xs font-bold tracking-widest text-text-dim uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                  Tags
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 px-2">
                {tags.length === 0 ? (
                  <p className="px-4 py-2 text-xs text-text-dim w-full">No tags yet</p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() =>
                        handleNavClick(() => {
                          setSelectedTag(selectedTag === tag.name ? null : tag.name);
                          setShowFavoritesOnly(false);
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        selectedTag === tag.name
                          ? "bg-brand-500/15 border border-brand-400/50 text-brand-300"
                          : "bg-surface-100 border border-brand-400/30 text-text-muted hover:border-brand-400/60 hover:text-foreground"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </nav>

          {/* Settings + Sign Out */}
          <div className="border-t border-surface-200 px-3 py-3 space-y-1">
            <ThemeToggle />
            <form action={signOut}>
              <button type="submit" className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:text-foreground hover:bg-surface-100 rounded-lg transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
