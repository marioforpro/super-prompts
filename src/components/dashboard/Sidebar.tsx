"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/icons/Logo";
import { useDashboard } from "@/contexts/DashboardContext";
import { createFolder, deleteFolder, renameFolder, updateFolder as updateFolderAction } from "@/lib/actions/folders";
import { assignPromptToFolder } from "@/lib/actions/prompts";
import type { Folder } from "@/lib/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  "#e8764b", "#f87171", "#fb923c", "#facc15", "#fbbf24",
  "#a3e635", "#34d399", "#2dd4bf", "#22d3ee", "#38bdf8",
  "#60a5fa", "#818cf8", "#a78bfa", "#c084fc", "#e879f9",
  "#f472b6", "#fb7185", "#d4a574", "#94a3b8", "#f0eff2",
];

function getModelColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const {
    folders,
    addFolder,
    removeFolder,
    updateFolder,
    models,
    selectedFolderId,
    setSelectedFolderId,
    selectedModelSlug,
    setSelectedModelSlug,
    selectedTags,
    setSelectedTags,
    selectedContentType,
    setSelectedContentType,
    showFavoritesOnly,
    setShowFavoritesOnly,
    notifyPromptFolderAssigned,
    draggedPromptId,
    setDraggedPromptId,
    draggedPromptIds,
    setDraggedPromptIds,
    markFolderVisited,
    setSearchQuery,
    promptIndex,
  } = useDashboard();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const editFolderInputRef = useRef<HTMLInputElement>(null);

  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragAfterIndex, setDragAfterIndex] = useState<number | null>(null);
  const folderListRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);

  const [modelOrder, setModelOrder] = useState<string[]>([]);
  const [modelDragId, setModelDragId] = useState<string | null>(null);
  const [modelDragOverId, setModelDragOverId] = useState<string | null>(null);
  const [modelDragAfterIndex, setModelDragAfterIndex] = useState<number | null>(null);
  const modelListRef = useRef<HTMLDivElement>(null);
  const isModelDragging = useRef(false);
  const modelDragStartY = useRef(0);

  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  const [dropToast, setDropToast] = useState<string | null>(null);
  const navScrollRef = useRef<HTMLElement>(null);
  const dragOverRafRef = useRef<number | null>(null);
  const dragOverClientYRef = useRef<number | null>(null);

  const folderMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("superprompts:model-order");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setModelOrder(parsed.filter((id) => typeof id === "string"));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("superprompts:model-order", JSON.stringify(modelOrder));
  }, [modelOrder]);

  useEffect(() => {
    if (isCreatingFolder && folderInputRef.current) folderInputRef.current.focus();
  }, [isCreatingFolder]);

  useEffect(() => {
    if (editingFolderId && editFolderInputRef.current) {
      editFolderInputRef.current.focus();
      editFolderInputRef.current.select();
    }
  }, [editingFolderId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (folderMenuRef.current && folderMenuRef.current.contains(e.target as Node)) return;
      if (colorPickerRef.current && colorPickerRef.current.contains(e.target as Node)) return;
      if (plusMenuRef.current && plusMenuRef.current.contains(e.target as Node)) return;
      setFolderMenuId(null);
      setColorPickerId(null);
      setPlusMenuOpen(false);
    };

    const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (dragOverRafRef.current !== null) cancelAnimationFrame(dragOverRafRef.current);
    };
  }, []);

  const isAllActive =
    !selectedFolderId && !selectedModelSlug && selectedTags.length === 0 && !selectedContentType && !showFavoritesOnly;

  const sortedFolders = [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const sortedModels = useMemo(() => {
    const base = [...models].sort((a, b) => a.name.localeCompare(b.name));
    if (modelOrder.length === 0) return base;
    const bySlug = new Map(base.map((m) => [m.slug, m]));
    const ordered: typeof base = [];
    for (const slug of modelOrder) {
      const model = bySlug.get(slug);
      if (model) {
        ordered.push(model);
        bySlug.delete(slug);
      }
    }
    ordered.push(...Array.from(bySlug.values()));
    return ordered;
  }, [models, modelOrder]);

  const totalPromptCount = promptIndex.length;
  const favoritesCount = useMemo(
    () => promptIndex.reduce((acc, item) => acc + (item.isFavorite ? 1 : 0), 0),
    [promptIndex]
  );

  const folderPromptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of promptIndex) {
      for (const folderId of item.folderIds) counts[folderId] = (counts[folderId] || 0) + 1;
    }
    return counts;
  }, [promptIndex]);

  const modelPromptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of promptIndex) {
      if (!item.modelSlug) continue;
      counts[item.modelSlug] = (counts[item.modelSlug] || 0) + 1;
    }
    return counts;
  }, [promptIndex]);

  const getPillClass = (active: boolean) =>
    active
      ? "inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-semibold text-white"
      : "inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-surface-200 px-2 text-[11px] font-semibold text-text-dim";

  const handleNavClick = (action: () => void) => {
    action();
    if (window.innerWidth < 768) onClose();
  };

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
      color: "#e8764b",
      sort_order: folders.length,
      user_id: "",
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

  const reorderFolders = (newOrder: typeof folders) => {
    newOrder.forEach((f, i) => updateFolder(f.id, { sort_order: i }));
    for (let i = 0; i < newOrder.length; i++) {
      updateFolderAction(newOrder[i].id, { sort_order: i }).catch(() => {});
    }
  };

  const handleMoveFolder = (folderId: string, direction: "up" | "down") => {
    const sorted = [...sortedFolders];
    const idx = sorted.findIndex((f) => f.id === folderId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    [sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]];
    reorderFolders(sorted);
    setFolderMenuId(null);
  };

  const handleFolderDragStart = (e: React.PointerEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragId(folderId);
    dragStartY.current = e.clientY;
    isDragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleFolderDragMove = (e: React.PointerEvent) => {
    if (!dragId || !folderListRef.current) return;
    if (!isDragging.current && Math.abs(e.clientY - dragStartY.current) < 3) return;
    isDragging.current = true;

    const els = folderListRef.current.querySelectorAll<HTMLElement>("[data-folder-drag]");
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

    const insertAfter = e.clientY > closestCy;
    setDragOverId(closestId);
    setDragAfterIndex(insertAfter ? closestIndex + 1 : closestIndex);
  };

  const handleFolderDragEnd = () => {
    if (dragId && dragOverId && isDragging.current) {
      const sorted = [...sortedFolders];
      const fromIdx = sorted.findIndex((f) => f.id === dragId);
      const toIdx = sorted.findIndex((f) => f.id === dragOverId);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const [moved] = sorted.splice(fromIdx, 1);
        const adjustedIdx = sorted.findIndex((f) => f.id === dragOverId);
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

  const handleModelDragStart = (e: React.PointerEvent, modelSlug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setModelDragId(modelSlug);
    modelDragStartY.current = e.clientY;
    isModelDragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleModelDragMove = (e: React.PointerEvent) => {
    if (!modelDragId || !modelListRef.current) return;
    if (!isModelDragging.current && Math.abs(e.clientY - modelDragStartY.current) < 3) return;
    isModelDragging.current = true;

    const els = modelListRef.current.querySelectorAll<HTMLElement>("[data-model-drag]");
    let closestId: string | null = null;
    let closestDist = Infinity;
    let closestCy = 0;
    let closestIndex = -1;

    els.forEach((el, idx) => {
      const fid = el.dataset.modelDrag || null;
      if (fid === modelDragId) return;
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

    const insertAfter = e.clientY > closestCy;
    setModelDragOverId(closestId);
    setModelDragAfterIndex(insertAfter ? closestIndex + 1 : closestIndex);
  };

  const handleModelDragEnd = () => {
    if (modelDragId && modelDragOverId && isModelDragging.current) {
      const ordered = [...sortedModels].map((m) => m.slug);
      const fromIdx = ordered.findIndex((slug) => slug === modelDragId);
      const toIdx = ordered.findIndex((slug) => slug === modelDragOverId);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const [moved] = ordered.splice(fromIdx, 1);
        const adjustedIdx = ordered.findIndex((slug) => slug === modelDragOverId);
        const insertIdx = modelDragAfterIndex !== null ? Math.min(modelDragAfterIndex, ordered.length) : adjustedIdx;
        ordered.splice(insertIdx, 0, moved);
        setModelOrder(ordered);
      }
    }
    setModelDragId(null);
    setModelDragOverId(null);
    setModelDragAfterIndex(null);
    isModelDragging.current = false;
  };

  const getDraggedPromptId = (event: React.DragEvent): string | null => {
    const custom = event.dataTransfer.getData("application/x-superprompts-prompt-id");
    const text = event.dataTransfer.getData("text/plain");
    const candidate = custom || text || draggedPromptId || null;
    if (!candidate) return null;
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidLike.test(candidate) ? candidate : null;
  };

  const getDraggedPromptIds = (event: React.DragEvent): string[] => {
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const raw = event.dataTransfer.getData("application/x-superprompts-prompt-ids");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((id) => typeof id === "string" && uuidLike.test(id));
          if (valid.length > 0) return Array.from(new Set(valid));
        }
      } catch {
        // ignore
      }
    }
    if (draggedPromptIds.length > 0) {
      return Array.from(new Set(draggedPromptIds.filter((id) => uuidLike.test(id))));
    }
    const single = getDraggedPromptId(event);
    return single ? [single] : [];
  };

  const handlePromptDragOverFolder = (event: React.DragEvent, folderId: string) => {
    const promptIds = getDraggedPromptIds(event);
    if (promptIds.length === 0) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (dropFolderId !== folderId) setDropFolderId(folderId);
    dragOverClientYRef.current = event.clientY;

    if (dragOverRafRef.current !== null) return;
    dragOverRafRef.current = requestAnimationFrame(() => {
      dragOverRafRef.current = null;
      const navEl = navScrollRef.current;
      if (!navEl) return;
      const clientY = dragOverClientYRef.current;
      if (clientY == null) return;
      const rect = navEl.getBoundingClientRect();
      const threshold = 48;
      const step = 14;
      if (clientY < rect.top + threshold) navEl.scrollTop -= step;
      else if (clientY > rect.bottom - threshold) navEl.scrollTop += step;
    });
  };

  const handlePromptDropOnFolder = async (event: React.DragEvent, folderId: string) => {
    const promptIds = getDraggedPromptIds(event);
    event.preventDefault();
    setDropFolderId(null);
    dragOverClientYRef.current = null;
    if (promptIds.length === 0) return;

    try {
      const results = await Promise.allSettled(promptIds.map((promptId) => assignPromptToFolder(promptId, folderId)));
      const succeeded = results
        .map((r, i) => ({ result: r, promptId: promptIds[i] }))
        .filter(({ result }) => result.status === "fulfilled");
      succeeded.forEach(({ promptId }) => notifyPromptFolderAssigned(promptId, folderId));
      const folderName = folders.find((f) => f.id === folderId)?.name || "folder";
      setDropToast(
        succeeded.length > 1
          ? `Added ${succeeded.length} prompts to "${folderName}"`
          : `Added to "${folderName}"`
      );
      setTimeout(() => setDropToast(null), 1800);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to add prompt to folder");
    } finally {
      setDraggedPromptId(null);
      setDraggedPromptIds([]);
      if (dragOverRafRef.current !== null) {
        cancelAnimationFrame(dragOverRafRef.current);
        dragOverRafRef.current = null;
      }
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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      )}

      <div
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-surface z-50 border-r border-surface-200 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] transform md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-100 md:hidden">
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col h-full">
          <div className="px-4 h-[57px] flex items-center justify-center border-b border-surface-200">
            <Link href="/dashboard" className="flex items-center">
              <Logo size="sm" showText={true} />
            </Link>
          </div>

          <nav ref={navScrollRef} className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll">
            <div className="space-y-1.5">
              <button
                onClick={() =>
                  handleNavClick(() => {
                    setSearchQuery("");
                    setSelectedFolderId(null);
                    setSelectedModelSlug(null);
                    setSelectedTags([]);
                    setSelectedContentType(null);
                    setShowFavoritesOnly(false);
                  })
                }
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isAllActive
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                    : "text-text-muted hover:text-foreground hover:bg-surface-100"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-sm font-medium truncate">All Prompts</span>
                </span>
                <span className={getPillClass(isAllActive)}>{totalPromptCount}</span>
              </button>

              <button
                onClick={() =>
                  handleNavClick(() => {
                    setSearchQuery("");
                    setSelectedFolderId(null);
                    setSelectedModelSlug(null);
                    setSelectedTags([]);
                    setSelectedContentType(null);
                    setShowFavoritesOnly(true);
                  })
                }
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  showFavoritesOnly
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                    : "text-text-muted hover:text-foreground hover:bg-surface-100"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium truncate">Favorites</span>
                </span>
                <span className={getPillClass(showFavoritesOnly)}>{favoritesCount}</span>
              </button>
            </div>

            <div className="h-px bg-surface-200 my-4" />

            {isCreatingFolder && (
              <div className="px-1 mb-2">
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
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName("");
                      setFolderError("");
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <svg className="w-3.5 h-3.5 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {folderError && <p className="text-xs text-red-400 mt-1">{folderError}</p>}
              </div>
            )}

            <div ref={folderListRef} className="space-y-0.5">
              {sortedFolders.map((folder, idx) => (
                <div
                  key={folder.id}
                  data-folder-drag={folder.id}
                  className={`relative group transition-all duration-100 ${
                    dragId === folder.id && isDragging.current ? "opacity-30 scale-[0.97]" : ""
                  }`}
                >
                  {dragOverId === folder.id && dragId !== folder.id && isDragging.current && (
                    <div className={`absolute left-4 right-4 h-0.5 bg-brand-400 rounded-full z-20 ${dragAfterIndex === idx + 1 ? "-bottom-px" : "-top-px"}`} />
                  )}

                  {editingFolderId === folder.id ? (
                    <div className="px-1 py-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={editFolderInputRef}
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleRenameFolder();
                            } else if (e.key === "Escape") {
                              setEditingFolderId(null);
                              setEditingFolderName("");
                            }
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-lg text-foreground focus:outline-none focus:border-brand-400"
                        />
                        <button onClick={handleRenameFolder} className="p-1.5 rounded-lg bg-brand-500/20 border border-brand-500/30">
                          <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() =>
                        handleNavClick(() => {
                          setSearchQuery("");
                          setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id);
                          if (selectedFolderId !== folder.id) markFolderVisited(folder.id);
                          setSelectedModelSlug(null);
                          setSelectedTags([]);
                          setSelectedContentType(null);
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
                      className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer select-none ${
                        selectedFolderId === folder.id
                          ? "bg-surface-200 text-foreground"
                          : dropFolderId === folder.id
                            ? "bg-brand-500/18 text-foreground ring-2 ring-brand-400/65 shadow-[0_0_0_1px_rgba(232,118,75,0.25)]"
                            : "text-text-muted hover:text-foreground hover:bg-surface-100"
                      }`}
                    >
                      <div
                        onPointerDown={(e) => handleFolderDragStart(e, folder.id)}
                        onPointerMove={handleFolderDragMove}
                        onPointerUp={handleFolderDragEnd}
                        onPointerCancel={handleFolderDragEnd}
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
                      <span className="truncate flex-1 text-sm">{folder.name}</span>
                      <span className={`${getPillClass(selectedFolderId === folder.id)} mr-5`}>{folderPromptCounts[folder.id] || 0}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderMenuId(folderMenuId === folder.id ? null : folder.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity p-0.5 hover:bg-surface-200 rounded cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-text-dim" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </span>
                    </div>
                  )}

                  {folderMenuId === folder.id && (
                    <div
                      ref={folderMenuRef}
                      className="absolute left-8 top-full z-50 mt-1 w-40 bg-surface-100 border border-surface-200 rounded-lg shadow-xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sortedFolders.indexOf(folder) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveFolder(folder.id, "up");
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200"
                        >
                          Move up
                        </button>
                      )}
                      {sortedFolders.indexOf(folder) < sortedFolders.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveFolder(folder.id, "down");
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200"
                        >
                          Move down
                        </button>
                      )}
                      <div className="h-px bg-surface-200 my-0.5" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                          setFolderMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorPickerId(folder.id);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-200"
                      >
                        Change color
                      </button>
                      <div className="h-px bg-surface-200 my-0.5" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolderAction(folder.id);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-surface-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {colorPickerId === folder.id && (
                    <div
                      ref={colorPickerRef}
                      className="absolute left-8 top-full z-50 mt-1 p-3 bg-surface-100 border border-surface-200 rounded-lg shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-5 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFolderColorChange(folder.id, color);
                            }}
                            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer"
                            style={{ backgroundColor: color, borderColor: folder.color === color ? "#ffffff" : "transparent" }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="h-px bg-surface-200 my-4" />

            <div ref={modelListRef} className="space-y-0.5 pb-6">
              {sortedModels.map((model, idx) => (
                <div
                  key={model.id}
                  data-model-drag={model.slug}
                  className={`relative group transition-all duration-100 ${
                    modelDragId === model.slug && isModelDragging.current ? "opacity-30 scale-[0.97]" : ""
                  }`}
                >
                  {modelDragOverId === model.slug && modelDragId !== model.slug && isModelDragging.current && (
                    <div className={`absolute left-4 right-4 h-0.5 bg-brand-400 rounded-full z-20 ${modelDragAfterIndex === idx + 1 ? "-bottom-px" : "-top-px"}`} />
                  )}

                  <div
                    onClick={() =>
                      handleNavClick(() => {
                        setSearchQuery("");
                        setSelectedModelSlug(selectedModelSlug === model.slug ? null : model.slug);
                        setSelectedFolderId(null);
                        setSelectedTags([]);
                        setSelectedContentType(null);
                        setShowFavoritesOnly(false);
                      })
                    }
                    className={`relative w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
                      selectedModelSlug === model.slug
                        ? "bg-surface-200 text-foreground"
                        : "text-text-muted hover:text-foreground hover:bg-surface-100"
                    }`}
                  >
                    <div
                      onPointerDown={(e) => handleModelDragStart(e, model.slug)}
                      onPointerMove={handleModelDragMove}
                      onPointerUp={handleModelDragEnd}
                      onPointerCancel={handleModelDragEnd}
                      className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity z-10 touch-none"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                        <circle cx="5" cy="3" r="1.3" /><circle cx="11" cy="3" r="1.3" />
                        <circle cx="5" cy="8" r="1.3" /><circle cx="11" cy="8" r="1.3" />
                        <circle cx="5" cy="13" r="1.3" /><circle cx="11" cy="13" r="1.3" />
                      </svg>
                    </div>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: model.icon_url?.startsWith("#") ? model.icon_url : getModelColor(model.name) }}
                    />
                    <span className="truncate flex-1 text-sm">{model.name}</span>
                    <span className={getPillClass(selectedModelSlug === model.slug)}>{modelPromptCounts[model.slug] || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-surface-200 px-3 py-3">
            <div ref={plusMenuRef} className="relative">
              {plusMenuOpen && (
                <div className="absolute bottom-12 left-0 right-0 z-50 bg-surface-100 border border-surface-200 rounded-xl shadow-xl overflow-hidden">
                  <button
                    onClick={() => {
                      setPlusMenuOpen(false);
                      setIsCreatingFolder(true);
                      setFolderError("");
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-text-muted hover:text-foreground hover:bg-surface-200"
                  >
                    New folder
                  </button>
                  <button
                    onClick={() => {
                      setPlusMenuOpen(false);
                      router.push("/dashboard/settings");
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-text-muted hover:text-foreground hover:bg-surface-200"
                  >
                    Manage AI models
                  </button>
                </div>
              )}

              <button
                onClick={() => setPlusMenuOpen((prev) => !prev)}
                className="w-full h-10 rounded-xl border border-surface-200 bg-surface-100 text-text-muted hover:text-foreground hover:border-surface-300 transition-colors flex items-center justify-center"
                title="Quick actions"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {dropToast && (
          <div className="absolute left-3 right-3 bottom-16 z-50 rounded-lg border border-brand-500/40 bg-brand-500/18 px-3 py-2 text-xs text-brand-200 shadow-lg backdrop-blur-sm">
            {dropToast}
          </div>
        )}
      </div>
    </>
  );
}
