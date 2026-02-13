"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/icons/Logo";
import { useDashboard } from "@/contexts/DashboardContext";
import { createFolder, deleteFolder, renameFolder, updateFolder as updateFolderAction } from "@/lib/actions/folders";
import { createTag, deleteTag } from "@/lib/actions/tags";
import { assignPromptToFolder } from "@/lib/actions/prompts";
import type { Folder } from "@/lib/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Shared color palette for folders and AI models
const COLOR_PALETTE = [
  '#e8764b', '#f87171', '#fb923c', '#facc15', '#fbbf24',
  '#a3e635', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8',
  '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9',
  '#f472b6', '#fb7185', '#d4a574', '#94a3b8', '#f0eff2',
];

// Legacy aliases
const FOLDER_COLORS = COLOR_PALETTE;
const MODEL_COLORS = COLOR_PALETTE;

function getModelColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MODEL_COLORS[hash % MODEL_COLORS.length];
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const {
    folders,
    addFolder,
    removeFolder,
    updateFolder,
    models,
    tags,
    selectedFolderId,
    setSelectedFolderId,
    selectedModelSlug,
    setSelectedModelSlug,
    selectedTags,
    setSelectedTags,
    addTag,
    selectedContentType,
    setSelectedContentType,
    showFavoritesOnly,
    setShowFavoritesOnly,
    removeTag: removeTagFromContext,
    notifyPromptFolderAssigned,
    draggedPromptId,
    setDraggedPromptId,
    recentFolderIds,
    markFolderVisited,
  } = useDashboard();

  // Collapsible sections
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [modelsOpen, setModelsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);

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


  // Tag management
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagError, setTagError] = useState("");
  const [confirmDeleteTagId, setConfirmDeleteTagId] = useState<string | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Drag-to-reorder state (indicator position is now managed via dragAfterIndex state)
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragAfterIndex, setDragAfterIndex] = useState<number | null>(null);
  const folderListRef = useRef<HTMLDivElement>(null);
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  const [dropToast, setDropToast] = useState<string | null>(null);
  const navScrollRef = useRef<HTMLElement>(null);

  // Focus input when creating folder
  useEffect(() => {
    if (isCreatingFolder && folderInputRef.current) {
      folderInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  // While dragging a prompt, keep folders visible so drop targets are always available.
  useEffect(() => {
    if (draggedPromptId) setFoldersOpen(true);
  }, [draggedPromptId]);

  // Focus input when renaming folder
  useEffect(() => {
    if (editingFolderId && editFolderInputRef.current) {
      editFolderInputRef.current.focus();
      editFolderInputRef.current.select();
    }
  }, [editingFolderId]);


  // Focus tag input
  useEffect(() => {
    if (isCreatingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isCreatingTag]);

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

  const isCreatingRef = useRef(false);
  const handleCreateFolder = async () => {
    if (isCreatingRef.current) return;
    const name = newFolderName.trim();
    if (!name) {
      setIsCreatingFolder(false);
      setNewFolderName("");
      return;
    }
    isCreatingRef.current = true;
    setFolderError("");
    const tempId = `temp-${Date.now()}`;
    setNewFolderName("");
    setIsCreatingFolder(false);
    const tempFolder: Folder = {
      id: tempId,
      name,
      color: '#e8764b',
      sort_order: folders.length,
      user_id: '',
      created_at: new Date().toISOString(),
    };
    addFolder(tempFolder);
    try {
      const folder = await createFolder(name);
      removeFolder(tempId);
      addFolder(folder);
    } catch (err) {
      removeFolder(tempId);
      setFolderError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      isCreatingRef.current = false;
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
    setFolderMenuId(null);
    if (selectedFolderId === folderId) setSelectedFolderId(null);
    removeFolder(folderId);
    try {
      await deleteFolder(folderId);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to delete folder");
    }
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

  // Reorder folders helper
  const reorderFolders = (newOrder: typeof folders) => {
    newOrder.forEach((f, i) => updateFolder(f.id, { sort_order: i }));
    for (let i = 0; i < newOrder.length; i++) {
      updateFolderAction(newOrder[i].id, { sort_order: i }).catch(() => {});
    }
  };

  const handleMoveFolder = (folderId: string, direction: 'up' | 'down') => {
    const sorted = [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex(f => f.id === folderId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    [sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]];
    reorderFolders(sorted);
    setFolderMenuId(null);
  };

  // Drag-to-reorder via pointer capture
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  const handleDragStart = (e: React.PointerEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragId(folderId);
    dragStartY.current = e.clientY;
    isDragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragId || !folderListRef.current) return;
    if (!isDragging.current && Math.abs(e.clientY - dragStartY.current) < 3) return;
    isDragging.current = true;

    const sorted = [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const els = folderListRef.current.querySelectorAll<HTMLElement>('[data-folder-drag]');
    let closestId: string | null = null;
    let closestDist = Infinity;
    let closestCy = 0;
    let closestIndex = -1;
    
    els.forEach((el, idx) => {
      const fid = el.dataset.folderDrag || null;
      if (fid === dragId) return;
      const rect = el.getBoundingClientRect();
      const cy = rect.top + rect.height / 2;
      const dist = Math.abs(e.clientY - cy);
      if (dist < closestDist) { 
        closestDist = dist; 
        closestId = fid; 
        closestCy = cy; 
        closestIndex = idx;
      }
    });

    // Determine if we're inserting after or before based on cursor position
    const insertAfter = e.clientY > closestCy;
    const finalIndex = insertAfter ? closestIndex + 1 : closestIndex;
    
    setDragOverId(closestId);
    setDragAfterIndex(insertAfter ? closestIndex + 1 : closestIndex);
  };

  const handleDragEnd = () => {
    if (dragId && dragOverId && isDragging.current) {
      const sorted = [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const fromIdx = sorted.findIndex(f => f.id === dragId);
      const toIdx = sorted.findIndex(f => f.id === dragOverId);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const [moved] = sorted.splice(fromIdx, 1);
        const adjustedIdx = sorted.findIndex(f => f.id === dragOverId);
        const insertIdx = dragAfterIndex !== null ? Math.min(dragAfterIndex, sorted.length) : adjustedIdx;
        sorted.splice(insertIdx, 0, moved);
        reorderFolders(sorted);
      }
    }
    setDragId(null);
    setDragOverId(null);
    setDragAfterIndex(null);
    isDragging.current = false;
  };

  const getDraggedPromptId = (event: React.DragEvent): string | null => {
    const custom = event.dataTransfer.getData("application/x-superprompts-prompt-id");
    const text = event.dataTransfer.getData("text/plain");
    const candidate = custom || text || draggedPromptId || null;
    if (!candidate) return null;
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidLike.test(candidate) ? candidate : null;
  };

  const handlePromptDragOverFolder = (event: React.DragEvent, folderId: string) => {
    const promptId = getDraggedPromptId(event);
    if (!promptId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropFolderId(folderId);

    // Auto-scroll sidebar when dragging near top/bottom edges.
    const navEl = navScrollRef.current;
    if (!navEl) return;
    const rect = navEl.getBoundingClientRect();
    const threshold = 48;
    const step = 14;
    if (event.clientY < rect.top + threshold) {
      navEl.scrollTop -= step;
    } else if (event.clientY > rect.bottom - threshold) {
      navEl.scrollTop += step;
    }
  };

  const handlePromptDropOnFolder = async (event: React.DragEvent, folderId: string) => {
    const promptId = getDraggedPromptId(event);
    event.preventDefault();
    setDropFolderId(null);
    if (!promptId) return;

    try {
      await assignPromptToFolder(promptId, folderId);
      notifyPromptFolderAssigned(promptId, folderId);
      const folderName = folders.find((f) => f.id === folderId)?.name || "folder";
      setDropToast(`Added to "${folderName}"`);
      setTimeout(() => setDropToast(null), 1800);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to add prompt to folder");
    } finally {
      setDraggedPromptId(null);
    }
  };


  // Create tag handler
  const isCreatingTagRef = useRef(false);
  const handleCreateTag = async () => {
    if (isCreatingTagRef.current) return;
    const name = newTagName.trim();
    if (!name) {
      setIsCreatingTag(false);
      setNewTagName("");
      return;
    }
    isCreatingTagRef.current = true;
    setTagError("");
    setNewTagName("");
    setIsCreatingTag(false);
    try {
      const tag = await createTag(name);
      addTag(tag);
    } catch (err) {
      setTagError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      isCreatingTagRef.current = false;
    }
  };

  // Delete tag handler
  const handleDeleteTag = async (tagId: string) => {
    const tagObj = tags.find(t => t.id === tagId);
    if (tagObj) {
      setSelectedTags(selectedTags.filter(t => t !== tagObj.name));
    }
    removeTagFromContext(tagId);
    try {
      await deleteTag(tagId);
    } catch (err) {
      console.error("Failed to delete tag:", err);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    } else if (e.key === "Escape") {
      setIsCreatingTag(false);
      setNewTagName("");
      setTagError("");
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
    !selectedFolderId && !selectedModelSlug && selectedTags.length === 0 && !selectedContentType && !showFavoritesOnly;

  const sortedFolders = [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const recentFolders = recentFolderIds
    .map((id) => sortedFolders.find((f) => f.id === id))
    .filter(Boolean) as Folder[];
  const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key !== 'j' && key !== 'k') return;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
      if (isInput) return;
      e.preventDefault();
      if (sortedFolders.length === 0) return;
      const currentIdx = selectedFolderId ? sortedFolders.findIndex((f) => f.id === selectedFolderId) : -1;
      const nextIdx = key === 'j'
        ? Math.min(sortedFolders.length - 1, Math.max(0, currentIdx + 1))
        : Math.max(0, currentIdx <= 0 ? 0 : currentIdx - 1);
      const folder = sortedFolders[nextIdx];
      if (!folder) return;
      setSelectedFolderId(folder.id);
      markFolderVisited(folder.id);
      setShowFavoritesOnly(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sortedFolders, selectedFolderId, setSelectedFolderId, setShowFavoritesOnly, markFolderVisited]);

  // Chevron component for collapsible sections
  const SectionChevron = ({ open }: { open: boolean }) => (
    <svg className={`w-3 h-3 text-text-dim transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

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
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-surface z-50 border-r border-surface-200 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] transform md:transform-none ${
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
          <div className="px-4 h-[57px] flex items-center justify-center border-b border-surface-200">
            <Link href="/dashboard" className="flex items-center">
              <Logo size="sm" showText={true} />
            </Link>
          </div>

          {/* Navigation */}
          <nav ref={navScrollRef} className="flex-1 overflow-y-auto px-3 py-5 space-y-1 sidebar-scroll">
            {/* All Prompts */}
            <button
              onClick={() =>
                handleNavClick(() => {
                  setSelectedFolderId(null);
                  setSelectedModelSlug(null);
                  setSelectedTags([]);
                  setSelectedContentType(null);
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
                  setSelectedTags([]);
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

            {/* Content type filter pills — icon-only for compact fit */}
            <div className="grid grid-cols-4 gap-1.5 mt-2 px-1">
              {(['IMAGE', 'VIDEO', 'AUDIO', 'TEXT'] as const).map((type) => {
                const isActive = selectedContentType === type;
                const label = type === 'IMAGE' ? 'Image' : type === 'VIDEO' ? 'Video' : type === 'AUDIO' ? 'Audio' : 'Text';
                const icon = type === 'IMAGE' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                ) : type === 'VIDEO' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                ) : type === 'AUDIO' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                );
                return (
                  <button
                    key={type}
                    title={label}
                    onClick={() =>
                      handleNavClick(() => {
                        setSelectedContentType(isActive ? null : type);
                        setShowFavoritesOnly(false);
                      })
                    }
                    className={`flex items-center justify-center py-2.5 rounded-md transition-all duration-150 cursor-pointer border ${
                      isActive
                        ? 'bg-brand-500/15 border-brand-400/40 text-brand-300'
                        : 'bg-surface-100 border-surface-200 text-text-dim hover:text-text-muted hover:border-surface-300'
                    }`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-surface-200 my-4" />

            {recentFolders.length > 0 && (
              <>
                <div className="px-4 py-2">
                  <span className="text-[10px] font-bold tracking-widest text-text-dim uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                    Recent Folders
                  </span>
                </div>
                <div className="space-y-0.5">
                  {recentFolders.slice(0, 4).map((folder) => (
                    <button
                      key={`recent-${folder.id}`}
                      onClick={() =>
                        handleNavClick(() => {
                          setSelectedFolderId(folder.id);
                          markFolderVisited(folder.id);
                          setShowFavoritesOnly(false);
                        })
                      }
                      className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedFolderId === folder.id
                          ? "bg-surface-200 text-foreground"
                          : "text-text-muted hover:text-foreground hover:bg-surface-100"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color || '#e8764b' }} />
                      <span className="truncate">{folder.name}</span>
                    </button>
                  ))}
                </div>
                <div className="h-px bg-surface-200 my-4" />
              </>
            )}

            {/* FOLDERS — collapsible */}
            <div>
              <div className="flex items-center justify-between px-4 py-2 gap-2">
                <button
                  onClick={() => setFoldersOpen(!foldersOpen)}
                  className="flex items-center gap-1.5 flex-1 cursor-pointer"
                >
                  <SectionChevron open={foldersOpen} />
                  <span className="text-xs font-bold tracking-widest text-text-dim uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                    Folders
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsCreatingFolder(true);
                    setFolderError("");
                    if (!foldersOpen) setFoldersOpen(true);
                  }}
                  className="p-1 hover:bg-surface-100 rounded transition-colors cursor-pointer"
                  title="Create folder"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {foldersOpen && (
                <>
                  {/* Inline folder creation */}
                  {isCreatingFolder && (
                    <div className="px-4 mt-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={folderInputRef}
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={handleFolderKeyDown}
                          placeholder="Folder name..."
                          className="flex-1 px-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
                        />
                        <button
                          onClick={handleCreateFolder}
                          className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 transition-colors cursor-pointer"
                          title="Create folder"
                        >
                          <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setIsCreatingFolder(false); setNewFolderName(""); setFolderError(""); }}
                          className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <svg className="w-3.5 h-3.5 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {folderError && (
                        <p className="text-xs text-red-400 mt-1">{folderError}</p>
                      )}
                    </div>
                  )}

                  <div ref={folderListRef} className="mt-1 space-y-0.5">
                    {sortedFolders.length === 0 && !isCreatingFolder ? (
                      <p className="px-4 py-2 text-xs text-text-dim">No folders yet</p>
                    ) : (
                      sortedFolders.map((folder, idx) => (
                        <div
                          key={folder.id}
                          data-folder-drag={folder.id}
                          className={`relative group transition-all duration-100 ${
                            dragId === folder.id && isDragging.current ? 'opacity-30 scale-[0.97]' : ''
                          }`}
                        >
                          {/* Drop indicator line */}
                          {dragOverId === folder.id && dragId !== folder.id && isDragging.current && (
                            <div className={`absolute left-4 right-4 h-0.5 bg-brand-400 rounded-full z-20 ${dragAfterIndex === idx + 1 ? '-bottom-px' : '-top-px'}`} />
                          )}
                          {editingFolderId === folder.id ? (
                            <div className="px-4 py-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  ref={editFolderInputRef}
                                  type="text"
                                  value={editingFolderName}
                                  onChange={(e) => setEditingFolderName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") { e.preventDefault(); handleRenameFolder(); }
                                    else if (e.key === "Escape") { setEditingFolderId(null); setEditingFolderName(""); }
                                  }}
                                  className="flex-1 px-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
                                />
                                <button
                                  onClick={handleRenameFolder}
                                  className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 transition-colors cursor-pointer"
                                  title="Confirm rename"
                                >
                                  <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => { setEditingFolderId(null); setEditingFolderName(""); }}
                                  className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <svg className="w-3.5 h-3.5 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() =>
                                handleNavClick(() => {
                                  setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id);
                                  if (selectedFolderId !== folder.id) markFolderVisited(folder.id);
                                  setShowFavoritesOnly(false);
                                })
                              }
                              onDragOver={(event) => handlePromptDragOverFolder(event, folder.id)}
                              onDrop={(event) => void handlePromptDropOnFolder(event, folder.id)}
                              onDragLeave={() => {
                                if (dropFolderId === folder.id) setDropFolderId(null);
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-150 cursor-pointer select-none ${
                                selectedFolderId === folder.id
                                  ? "bg-surface-200 text-foreground"
                                  : dropFolderId === folder.id
                                    ? "bg-brand-500/18 text-foreground ring-2 ring-brand-400/65 shadow-[0_0_0_1px_rgba(232,118,75,0.25)]"
                                    : "text-text-muted hover:text-foreground hover:bg-surface-100"
                              }`}
                            >
                              {/* Drag handle */}
                              <div
                                onPointerDown={(e) => handleDragStart(e, folder.id)}
                                onPointerMove={handleDragMove}
                                onPointerUp={handleDragEnd}
                                onPointerCancel={handleDragEnd}
                                className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity z-10 touch-none"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                                  <circle cx="5" cy="3" r="1.3" /><circle cx="11" cy="3" r="1.3" />
                                  <circle cx="5" cy="8" r="1.3" /><circle cx="11" cy="8" r="1.3" />
                                  <circle cx="5" cy="13" r="1.3" /><circle cx="11" cy="13" r="1.3" />
                                </svg>
                              </div>
                              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: folder.color || "#e8764b" }}>
                                <path d="M2 6a3 3 0 013-3h4.172a3 3 0 012.12.879L12.415 5H19a3 3 0 013 3v9a3 3 0 01-3 3H5a3 3 0 01-3-3V6z" />
                              </svg>
                              <span className="truncate flex-1 text-left">{folder.name}</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
                                }}
                                className="opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity p-0.5 hover:bg-surface-200 rounded cursor-pointer"
                              >
                                <svg className="w-4 h-4 text-text-dim" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </span>
                            </div>
                          )}

                          {/* Context menu */}
                          {folderMenuId === folder.id && (
                            <div
                              ref={folderMenuRef}
                              className="absolute left-8 top-full z-50 mt-1 w-40 bg-surface-100 border border-surface-200 rounded-lg shadow-xl overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {sortedFolders.indexOf(folder) > 0 && (
                                <button
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleMoveFolder(folder.id, 'up'); }}
                                  className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                  Move up
                                </button>
                              )}
                              {sortedFolders.indexOf(folder) < sortedFolders.length - 1 && (
                                <button
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleMoveFolder(folder.id, 'down'); }}
                                  className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  Move down
                                </button>
                              )}
                              <div className="h-px bg-surface-200 my-0.5" />
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); setFolderMenuId(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200 transition-colors cursor-pointer"
                              >
                                Rename
                              </button>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setColorPickerId(folder.id); }}
                                className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200 transition-colors cursor-pointer"
                              >
                                Change color
                              </button>
                              <div className="h-px bg-surface-200 my-0.5" />
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleDeleteFolderAction(folder.id); }}
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
                                    onClick={(e) => { e.stopPropagation(); handleFolderColorChange(folder.id, color); }}
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
                </>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-surface-200 my-4" />

            {/* AI MODELS — collapsible, filter-only */}
            <div>
              <div className="flex items-center justify-between px-4 py-2 gap-2">
                <button
                  onClick={() => setModelsOpen(!modelsOpen)}
                  className="flex items-center gap-1.5 flex-1 cursor-pointer"
                >
                  <SectionChevron open={modelsOpen} />
                  <span className="text-xs font-bold tracking-widest text-text-dim uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                    AI Models
                  </span>
                </button>
                <button
                  onClick={() => {
                    router.push('/dashboard/settings');
                  }}
                  className="p-1 hover:bg-surface-100 rounded transition-colors cursor-pointer"
                  title="Manage AI models"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {modelsOpen && (
                <div className="mt-1 space-y-0.5 pl-2">
                  {sortedModels.length === 0 ? (
                    <p className="px-4 py-2 text-xs text-text-dim">No models yet</p>
                  ) : (
                    sortedModels.map((model) => (
                      <div
                        key={model.id}
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
                          style={{ backgroundColor: (model.icon_url && model.icon_url.startsWith('#')) ? model.icon_url : getModelColor(model.name) }}
                        />
                        <span className="truncate flex-1">{model.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-surface-200 my-4" />

            {/* TAGS — collapsible */}
            <div>
              <div className="flex items-center justify-between px-4 py-2 gap-2">
                <button
                  onClick={() => setTagsOpen(!tagsOpen)}
                  className="flex items-center gap-1.5 flex-1 cursor-pointer"
                >
                  <SectionChevron open={tagsOpen} />
                  <span className="text-xs font-bold tracking-widest text-text-dim uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                    Tags
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsCreatingTag(true);
                    setTagError("");
                    if (!tagsOpen) setTagsOpen(true);
                  }}
                  className="p-1 hover:bg-surface-100 rounded transition-colors cursor-pointer"
                  title="Create tag"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {tagsOpen && (
                <>
                  {/* Inline tag creation */}
                  {isCreatingTag && (
                    <div className="px-4 mt-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={tagInputRef}
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="Tag name..."
                          className="flex-1 px-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
                        />
                        <button
                          onClick={handleCreateTag}
                          className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 transition-colors cursor-pointer"
                          title="Create tag"
                        >
                          <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setIsCreatingTag(false); setNewTagName(""); setTagError(""); }}
                          className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <svg className="w-3.5 h-3.5 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {tagError && (
                        <p className="text-xs text-red-400 mt-1">{tagError}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-1 flex flex-wrap gap-2 px-2">
                    {tags.length === 0 && !isCreatingTag ? (
                      <p className="px-4 py-2 text-xs text-text-dim w-full">No tags yet</p>
                    ) : (
                      tags.map((tag) => (
                        <div key={tag.id} className="relative group/tag inline-flex">
                          <button
                            onClick={() =>
                              handleNavClick(() => {
                                const isSelected = selectedTags.includes(tag.name);
                                if (isSelected) {
                                  setSelectedTags(selectedTags.filter(t => t !== tag.name));
                                } else {
                                  setSelectedTags([...selectedTags, tag.name]);
                                }
                                setShowFavoritesOnly(false);
                              })
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                              selectedTags.includes(tag.name)
                                ? "bg-brand-500/15 border border-brand-400/50 text-brand-300 pr-6"
                                : "bg-surface-100 border border-brand-400/30 text-text-muted hover:border-brand-400/60 hover:text-foreground group-hover/tag:pr-6"
                            }`}
                          >
                            #{tag.name}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirmDeleteTagId === tag.id) {
                                handleDeleteTag(tag.id);
                                setConfirmDeleteTagId(null);
                              } else {
                                setConfirmDeleteTagId(tag.id);
                                setTimeout(() => setConfirmDeleteTagId(null), 3000);
                              }
                            }}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-all cursor-pointer ${
                              confirmDeleteTagId === tag.id
                                ? 'opacity-100 bg-red-500/30 text-red-300'
                                : 'opacity-0 group-hover/tag:opacity-100 hover:bg-red-500/30 text-text-dim hover:text-red-300'
                            }`}
                            title={confirmDeleteTagId === tag.id ? "Click again to confirm delete" : "Delete tag"}
                          >
                            {confirmDeleteTagId === tag.id ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-surface-200 px-4 py-3">
            <p className="text-[10px] text-text-dim text-center tracking-wider uppercase">Super Prompts v1.0</p>
          </div>
        </div>

        {dropToast && (
          <div className="absolute left-3 right-3 bottom-3 z-50 rounded-lg border border-brand-500/40 bg-brand-500/18 px-3 py-2 text-xs text-brand-200 shadow-lg backdrop-blur-sm">
            {dropToast}
          </div>
        )}
      </div>
    </>
  );
}
