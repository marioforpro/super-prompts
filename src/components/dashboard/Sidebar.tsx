"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/icons/Logo";
import { useDashboard } from "@/contexts/DashboardContext";
import { createFolder, updateFolder as updateFolderAction } from "@/lib/actions/folders";
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
  const {
    folders,
    addFolder,
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

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragAfterIndex, setDragAfterIndex] = useState<number | null>(null);
  const folderListRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  const [modelOrder, setModelOrder] = useState<string[]>([]);
  const [modelDragId, setModelDragId] = useState<string | null>(null);
  const [modelDragOverId, setModelDragOverId] = useState<string | null>(null);
  const [modelDragAfterIndex, setModelDragAfterIndex] = useState<number | null>(null);
  const modelListRef = useRef<HTMLDivElement>(null);
  const modelDragStartY = useRef(0);
  const isModelDragging = useRef(false);

  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  const navScrollRef = useRef<HTMLElement>(null);
  const dragOverRafRef = useRef<number | null>(null);
  const dragOverClientYRef = useRef<number | null>(null);
  const suppressFolderClickRef = useRef(false);
  const suppressModelClickRef = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem("superprompts:model-order");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setModelOrder(parsed.filter((item) => typeof item === "string"));
      }
    } catch {
      // Ignore invalid local cache.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("superprompts:model-order", JSON.stringify(modelOrder));
  }, [modelOrder]);

  useEffect(() => {
    if (isCreatingFolder && folderInputRef.current) folderInputRef.current.focus();
  }, [isCreatingFolder]);

  useEffect(() => {
    return () => {
      if (dragOverRafRef.current !== null) cancelAnimationFrame(dragOverRafRef.current);
    };
  }, []);

  const handleNavClick = (action: () => void) => {
    action();
    if (window.innerWidth < 768) onClose();
  };

  const isAllActive =
    !selectedFolderId && !selectedModelSlug && selectedTags.length === 0 && !selectedContentType && !showFavoritesOnly;

  const sortedFolders = [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const sortedModels = useMemo(() => {
    const byName = [...models].sort((a, b) => a.name.localeCompare(b.name));
    if (modelOrder.length === 0) return byName;

    const bySlug = new Map(byName.map((m) => [m.slug, m]));
    const ordered: typeof byName = [];

    for (const slug of modelOrder) {
      const model = bySlug.get(slug);
      if (!model) continue;
      ordered.push(model);
      bySlug.delete(slug);
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
      for (const folderId of item.folderIds) {
        counts[folderId] = (counts[folderId] || 0) + 1;
      }
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

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setIsCreatingFolder(false);
      setNewFolderName("");
      return;
    }

    setFolderError("");
    try {
      const folder = await createFolder(name);
      addFolder(folder);
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const reorderFolders = (newOrder: Folder[]) => {
    newOrder.forEach((folder, index) => updateFolder(folder.id, { sort_order: index }));
    for (let i = 0; i < newOrder.length; i++) {
      updateFolderAction(newOrder[i].id, { sort_order: i }).catch(() => {});
    }
  };

  const handleFolderDragStart = (event: React.PointerEvent, folderId: string) => {
    setDragId(folderId);
    dragStartY.current = event.clientY;
    isDragging.current = false;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handleFolderDragMove = (event: React.PointerEvent) => {
    if (!dragId || !folderListRef.current) return;
    if (!isDragging.current && Math.abs(event.clientY - dragStartY.current) < 3) return;
    isDragging.current = true;

    const rows = folderListRef.current.querySelectorAll<HTMLElement>("[data-folder-drag]");
    let closestId: string | null = null;
    let closestDist = Infinity;
    let closestCy = 0;
    let closestIndex = -1;

    rows.forEach((row, index) => {
      const rowId = row.dataset.folderDrag || null;
      if (rowId === dragId) return;
      const rect = row.getBoundingClientRect();
      const cy = rect.top + rect.height / 2;
      const dist = Math.abs(event.clientY - cy);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = rowId;
        closestCy = cy;
        closestIndex = index;
      }
    });

    const insertAfter = event.clientY > closestCy;
    setDragOverId(closestId);
    setDragAfterIndex(insertAfter ? closestIndex + 1 : closestIndex);
  };

  const handleFolderDragEnd = () => {
    const wasDragging = isDragging.current;
    if (dragId && dragOverId && isDragging.current) {
      const ordered = [...sortedFolders];
      const from = ordered.findIndex((folder) => folder.id === dragId);
      const to = ordered.findIndex((folder) => folder.id === dragOverId);
      if (from !== -1 && to !== -1 && from !== to) {
        const [moved] = ordered.splice(from, 1);
        const adjustedTo = ordered.findIndex((folder) => folder.id === dragOverId);
        const insertAt = dragAfterIndex !== null ? Math.min(dragAfterIndex, ordered.length) : adjustedTo;
        ordered.splice(insertAt, 0, moved);
        reorderFolders(ordered);
      }
    }

    setDragId(null);
    setDragOverId(null);
    setDragAfterIndex(null);
    isDragging.current = false;
    if (wasDragging) {
      suppressFolderClickRef.current = true;
      setTimeout(() => {
        suppressFolderClickRef.current = false;
      }, 0);
    }
  };

  const handleModelDragStart = (event: React.PointerEvent, modelSlug: string) => {
    setModelDragId(modelSlug);
    modelDragStartY.current = event.clientY;
    isModelDragging.current = false;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handleModelDragMove = (event: React.PointerEvent) => {
    if (!modelDragId || !modelListRef.current) return;
    if (!isModelDragging.current && Math.abs(event.clientY - modelDragStartY.current) < 3) return;
    isModelDragging.current = true;

    const rows = modelListRef.current.querySelectorAll<HTMLElement>("[data-model-drag]");
    let closestId: string | null = null;
    let closestDist = Infinity;
    let closestCy = 0;
    let closestIndex = -1;

    rows.forEach((row, index) => {
      const rowId = row.dataset.modelDrag || null;
      if (rowId === modelDragId) return;
      const rect = row.getBoundingClientRect();
      const cy = rect.top + rect.height / 2;
      const dist = Math.abs(event.clientY - cy);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = rowId;
        closestCy = cy;
        closestIndex = index;
      }
    });

    const insertAfter = event.clientY > closestCy;
    setModelDragOverId(closestId);
    setModelDragAfterIndex(insertAfter ? closestIndex + 1 : closestIndex);
  };

  const handleModelDragEnd = () => {
    const wasDragging = isModelDragging.current;
    if (modelDragId && modelDragOverId && isModelDragging.current) {
      const orderedSlugs = [...sortedModels].map((model) => model.slug);
      const from = orderedSlugs.findIndex((slug) => slug === modelDragId);
      const to = orderedSlugs.findIndex((slug) => slug === modelDragOverId);
      if (from !== -1 && to !== -1 && from !== to) {
        const [moved] = orderedSlugs.splice(from, 1);
        const adjustedTo = orderedSlugs.findIndex((slug) => slug === modelDragOverId);
        const insertAt = modelDragAfterIndex !== null ? Math.min(modelDragAfterIndex, orderedSlugs.length) : adjustedTo;
        orderedSlugs.splice(insertAt, 0, moved);
        setModelOrder(orderedSlugs);
      }
    }

    setModelDragId(null);
    setModelDragOverId(null);
    setModelDragAfterIndex(null);
    isModelDragging.current = false;
    if (wasDragging) {
      suppressModelClickRef.current = true;
      setTimeout(() => {
        suppressModelClickRef.current = false;
      }, 0);
    }
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
        // Ignore malformed payload.
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
      const results = await Promise.allSettled(
        promptIds.map((promptId) => assignPromptToFolder(promptId, folderId))
      );
      const succeeded = results
        .map((result, index) => ({ result, promptId: promptIds[index] }))
        .filter(({ result }) => result.status === "fulfilled");
      succeeded.forEach(({ promptId }) => notifyPromptFolderAssigned(promptId, folderId));
    } catch {
      // Ignore toast/error spam for this drag action; the UI state remains consistent.
    } finally {
      setDraggedPromptId(null);
      setDraggedPromptIds([]);
      if (dragOverRafRef.current !== null) {
        cancelAnimationFrame(dragOverRafRef.current);
        dragOverRafRef.current = null;
      }
    }
  };

  const handleFolderKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreateFolder();
    } else if (event.key === "Escape") {
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
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-default ${
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
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-default ${
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

            <div className="px-1 mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-dim">Folders</p>
            </div>

            {isCreatingFolder && (
              <div className="px-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={folderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    onKeyDown={handleFolderKeyDown}
                    placeholder="Folder name..."
                    className="flex-1 px-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 transition-colors cursor-default"
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
                    className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors cursor-default"
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
              {sortedFolders.map((folder, index) => (
                <div
                  key={folder.id}
                  data-folder-drag={folder.id}
                  className={`relative group transition-all duration-100 ${
                    dragId === folder.id && isDragging.current ? "opacity-30 scale-[0.97]" : ""
                  }`}
                >
                  {dragOverId === folder.id && dragId !== folder.id && isDragging.current && (
                    <div className={`absolute left-4 right-4 h-0.5 bg-brand-400 rounded-full z-20 ${dragAfterIndex === index + 1 ? "-bottom-px" : "-top-px"}`} />
                  )}

                  <div
                    onClick={() =>
                      handleNavClick(() => {
                        if (suppressFolderClickRef.current) return;
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
                    onPointerDown={(event) => handleFolderDragStart(event, folder.id)}
                    onPointerMove={handleFolderDragMove}
                    onPointerUp={handleFolderDragEnd}
                    onPointerCancel={handleFolderDragEnd}
                    className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 select-none touch-none ${
                      selectedFolderId === folder.id
                        ? "bg-surface-200 text-foreground cursor-default"
                        : dropFolderId === folder.id
                          ? "bg-brand-500/18 text-foreground ring-2 ring-brand-400/65 shadow-[0_0_0_1px_rgba(232,118,75,0.25)]"
                          : "text-text-muted hover:text-foreground hover:bg-surface-100 cursor-default"
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: folder.color || "#e8764b" }}>
                      <path d="M2 6a3 3 0 013-3h4.172a3 3 0 012.12.879L12.415 5H19a3 3 0 013 3v9a3 3 0 01-3 3H5a3 3 0 01-3-3V6z" />
                    </svg>

                    <span className="truncate flex-1 text-sm">{folder.name}</span>
                    {(folderPromptCounts[folder.id] || 0) > 0 && (
                      <span className={getPillClass(selectedFolderId === folder.id)}>{folderPromptCounts[folder.id]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-surface-200 my-4" />

            <div className="px-1 mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-dim">AI Models</p>
            </div>

            <div ref={modelListRef} className="space-y-0.5 pb-6">
              {sortedModels.map((model, index) => (
                <div
                  key={model.id}
                  data-model-drag={model.slug}
                  className={`relative group transition-all duration-100 ${
                    modelDragId === model.slug && isModelDragging.current ? "opacity-30 scale-[0.97]" : ""
                  }`}
                >
                  {modelDragOverId === model.slug && modelDragId !== model.slug && isModelDragging.current && (
                    <div className={`absolute left-4 right-4 h-0.5 bg-brand-400 rounded-full z-20 ${modelDragAfterIndex === index + 1 ? "-bottom-px" : "-top-px"}`} />
                  )}

                  <div
                    onClick={() =>
                      handleNavClick(() => {
                        if (suppressModelClickRef.current) return;
                        setSearchQuery("");
                        setSelectedModelSlug(selectedModelSlug === model.slug ? null : model.slug);
                        setSelectedFolderId(null);
                        setSelectedTags([]);
                        setSelectedContentType(null);
                        setShowFavoritesOnly(false);
                      })
                    }
                    onPointerDown={(event) => handleModelDragStart(event, model.slug)}
                    onPointerMove={handleModelDragMove}
                    onPointerUp={handleModelDragEnd}
                    onPointerCancel={handleModelDragEnd}
                    className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 select-none touch-none ${
                      selectedModelSlug === model.slug
                        ? "bg-surface-200 text-foreground cursor-default"
                        : "text-text-muted hover:text-foreground hover:bg-surface-100 cursor-default"
                    }`}
                  >
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

          <div className="border-t border-surface-200 px-3 py-3 space-y-2">
            <button
              onClick={() => {
                setIsCreatingFolder(true);
                setFolderError("");
              }}
              className="w-full h-10 rounded-xl border border-surface-200 bg-surface-100 text-text-muted hover:text-foreground hover:border-surface-300 transition-colors flex items-center justify-center gap-2"
              title="New folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">New folder</span>
            </button>

            <button
              onClick={() => {
                if (window.innerWidth < 768) onClose();
                window.location.assign("/dashboard/settings");
              }}
              className="w-full h-10 rounded-xl border border-surface-200 bg-surface-100 text-text-muted hover:text-foreground hover:border-surface-300 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l.457.2a1 1 0 00.826 0l.457-.2a1 1 0 011.35.936l.06.49a1 1 0 00.6.812l.452.182a1 1 0 01.53 1.3l-.2.457a1 1 0 000 .826l.2.457a1 1 0 01-.53 1.3l-.452.182a1 1 0 00-.6.812l-.06.49a1 1 0 01-1.35.936l-.457-.2a1 1 0 00-.826 0l-.457.2a1 1 0 01-1.35-.936l-.06-.49a1 1 0 00-.6-.812l-.452-.182a1 1 0 01-.53-1.3l.2-.457a1 1 0 000-.826l-.2-.457a1 1 0 01.53-1.3l.452-.182a1 1 0 00.6-.812l.06-.49z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
