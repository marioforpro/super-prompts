"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PromptGrid } from "./PromptGrid";
import { PromptListView } from "./PromptListView";
import { EmptyState } from "./EmptyState";
import { CreatePromptModal } from "./CreatePromptModal";
import WelcomeGuide from "./WelcomeGuide";
import type { Prompt, AiModel, Folder, Tag } from "@/lib/types";
import { assignPromptToFolder, toggleFavorite, unassignPromptFromFolder } from "@/lib/actions/prompts";
import { useDashboard } from "@/contexts/DashboardContext";
import { fuzzySearchFields } from "@/lib/fuzzySearch";
import { useRouter } from "next/navigation";

interface DashboardContentProps {
  initialPrompts: Prompt[];
  models: AiModel[];
  folders: Folder[];
  tags: Tag[];
  onModalOpen?: (callback: () => void) => void;
}

export function DashboardContent({
  initialPrompts,
  models,
  folders,
  tags: initialTags,
  onModalOpen,
}: DashboardContentProps) {
  const router = useRouter();
  const {
    viewMode,
    searchQuery,
    setSearchQuery,
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
    folders: contextFolders,
    addFolder,
    addModel,
    registerPromptFolderAssignHandler,
    markFolderVisited,
    markPromptVisited,
    recentPromptIds,
    setPromptIndex,
  } = useDashboard();

  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [modalPromptIds, setModalPromptIds] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedForBulk, setSelectedForBulk] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'info' | 'error' }>>([]);
  const toastIdRef = useRef(0);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Register modal open callback with parent
  useEffect(() => {
    onModalOpen?.(() => {
      setEditingPrompt(null);
      setIsModalOpen(true);
    });
  }, [onModalOpen]);

  useEffect(() => {
    registerPromptFolderAssignHandler((promptId, folderId) => {
      setPrompts((prev) =>
        prev.map((p) => {
          if (p.id !== promptId) return p;
          const nextFolderIds = Array.from(new Set([...(p.folder_ids || []), folderId]));
          return { ...p, folder_ids: nextFolderIds };
        })
      );
    });

    return () => registerPromptFolderAssignHandler(null);
  }, [registerPromptFolderAssignHandler]);

  useEffect(() => {
    setPromptIndex(
      prompts.map((p) => ({
        id: p.id,
        isFavorite: p.is_favorite,
        modelSlug: p.ai_model?.slug || null,
        folderIds: p.folder_ids || (p.folder_id ? [p.folder_id] : []),
      }))
    );
  }, [prompts, setPromptIndex]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]); // Keep max 3
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, type === 'error' ? 4000 : 2500);
  }, []);

  const showCopyToast = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const handleOpenModal = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    markPromptVisited(prompt.id);
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrompt(null);
    setModalPromptIds([]);
  };

  const handleSuccessModal = (updatedPrompt: Prompt) => {
    if (!updatedPrompt) {
      // Prompt was deleted from modal
      if (editingPrompt) {
        setPrompts(prompts.filter((p) => p.id !== editingPrompt.id));
        showToast("Prompt deleted successfully");
      }
      return;
    }
    if (editingPrompt) {
      // Update existing prompt
      setPrompts(
        prompts.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p))
      );
      showToast("Prompt updated successfully", "success");
    } else {
      // Add new prompt
      setPrompts([updatedPrompt, ...prompts]);
      showToast("Prompt created successfully", "success");
    }
  };

  const handleCopyPrompt = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    showCopyToast("Prompt copied to clipboard!");
  };

  const handleFavoritePrompt = useCallback(
    async (id: string) => {
      try {
        const updatedPrompt = await toggleFavorite(id);
        setPrompts(
          prompts.map((p) => (p.id === id ? updatedPrompt : p))
        );
        showToast(
          updatedPrompt.is_favorite
            ? "Added to favorites"
            : "Removed from favorites"
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to update favorite"
        );
      }
    },
    [prompts]
  );

  useEffect(() => {
    if (!selectedFolderId) return;
    markFolderVisited(selectedFolderId);
  }, [selectedFolderId, markFolderVisited]);

  // Apply search + filters
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    // Search query (fuzzy match on title, content, notes, tags, model)
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      const scored = result
        .map((p) => ({
          prompt: p,
          score: fuzzySearchFields(q, [
            p.title,
            p.content,
            p.notes,
            p.ai_model?.name,
            ...(p.tags?.map((t) => t.name) || []),
          ]),
        }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score);
      result = scored.map((s) => s.prompt);
    }

    // Folder filter
    if (selectedFolderId) {
      result = result.filter((p) =>
        (p.folder_ids && p.folder_ids.length > 0)
          ? p.folder_ids.includes(selectedFolderId)
          : p.folder_id === selectedFolderId
      );
    }

    // Model filter
    if (selectedModelSlug) {
      result = result.filter((p) => p.ai_model?.slug === selectedModelSlug);
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((p) =>
        selectedTags.every((tag) => p.tags?.some((t) => t.name === tag))
      );
    }

    // Content type filter
    if (selectedContentType) {
      result = result.filter((p) => p.content_type === selectedContentType);
    }

    // Favorites only
    if (showFavoritesOnly) {
      result = result.filter((p) => p.is_favorite);
    }

    return result;
  }, [prompts, searchQuery, selectedFolderId, selectedModelSlug, selectedTags, selectedContentType, showFavoritesOnly]);

  // Dynamic heading
  const activeFilterLabel = useMemo(() => {
    if (showFavoritesOnly) return "Favorites";
    if (selectedFolderId) {
      const folder = contextFolders.find((f) => f.id === selectedFolderId);
      return folder ? folder.name : "Folder";
    }
    if (selectedModelSlug) {
      const model = models.find((m) => m.slug === selectedModelSlug);
      return model ? model.name : "Model";
    }
    if (selectedTags.length > 0) return selectedTags.map(t => '#' + t).join(' + ');
    if (selectedContentType) return `${selectedContentType.charAt(0) + selectedContentType.slice(1).toLowerCase()} Prompts`;
    return "All Prompts";
  }, [showFavoritesOnly, selectedFolderId, selectedModelSlug, selectedTags, selectedContentType, contextFolders, models]);

  const hasActiveFilters = !!(searchQuery.trim() || selectedFolderId || selectedModelSlug || selectedTags.length > 0 || selectedContentType || showFavoritesOnly);
  const sortedFolders = useMemo(
    () => [...contextFolders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [contextFolders]
  );

  const effectiveSelectedPromptId = selectedPromptId && filteredPrompts.some((p) => p.id === selectedPromptId)
    ? selectedPromptId
    : (filteredPrompts[0]?.id || null);

  useEffect(() => {
    const openPalette = () => {
      setPaletteOpen(true);
      setPaletteQuery("");
      setPaletteIndex(0);
      setTimeout(() => paletteInputRef.current?.focus(), 0);
    };
    window.addEventListener("open-command-palette", openPalette);
    return () => window.removeEventListener("open-command-palette", openPalette);
  }, []);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedFolderId(null);
    setSelectedModelSlug(null);
    setSelectedTags([]);
    setSelectedContentType(null);
    setShowFavoritesOnly(false);
  };

  type PaletteItem = {
    id: string;
    label: string;
    hint?: string;
    group: string;
    action: () => void;
  };

  const paletteItems: PaletteItem[] = (() => {
    const q = paletteQuery.trim().toLowerCase();
    const items: PaletteItem[] = [];
    const pushIfMatch = (item: PaletteItem, fields: string[]) => {
      if (!q || fields.some((f) => f.toLowerCase().includes(q))) items.push(item);
    };

    pushIfMatch({
      id: "action:new",
      label: "New Prompt",
      hint: "Create",
      group: "Actions",
      action: () => {
        setPaletteOpen(false);
        handleOpenModal();
      },
    }, ["new prompt", "create"]);
    pushIfMatch({
      id: "action:all",
      label: "All Prompts",
      hint: "Clear filters",
      group: "Actions",
      action: () => {
        clearAllFilters();
        setPaletteOpen(false);
      },
    }, ["all prompts", "clear filters"]);
    pushIfMatch({
      id: "action:settings",
      label: "Open Settings",
      hint: "/dashboard/settings",
      group: "Actions",
      action: () => {
        setPaletteOpen(false);
        router.push("/dashboard/settings");
      },
    }, ["settings", "models"]);

    const promptById = new Map(prompts.map((p) => [p.id, p]));
    for (const id of recentPromptIds) {
      const p = promptById.get(id);
      if (!p) continue;
      pushIfMatch({
        id: `recent:${p.id}`,
        label: p.title,
        hint: "Recently viewed",
        group: "Recent",
        action: () => {
          setPaletteOpen(false);
          handleEditPrompt(p);
        },
      }, [p.title, p.content]);
    }

    for (const p of prompts.slice(0, 60)) {
      pushIfMatch({
        id: `prompt:${p.id}`,
        label: p.title,
        hint: p.ai_model?.name || "Prompt",
        group: "Prompts",
        action: () => {
          setPaletteOpen(false);
          handleEditPrompt(p);
        },
      }, [p.title, p.content, p.ai_model?.name || ""]);
    }
    for (const f of contextFolders) {
      pushIfMatch({
        id: `folder:${f.id}`,
        label: f.name,
        hint: "Folder",
        group: "Folders",
        action: () => {
          setSearchQuery("");
          setSelectedFolderId(f.id);
          setSelectedModelSlug(null);
          setSelectedTags([]);
          setSelectedContentType(null);
          setShowFavoritesOnly(false);
          setPaletteOpen(false);
        },
      }, [f.name, "folder"]);
    }
    for (const m of models) {
      pushIfMatch({
        id: `model:${m.slug}`,
        label: m.name,
        hint: "Model",
        group: "Models",
        action: () => {
          setSearchQuery("");
          setSelectedModelSlug(m.slug);
          setSelectedFolderId(null);
          setSelectedTags([]);
          setSelectedContentType(null);
          setShowFavoritesOnly(false);
          setPaletteOpen(false);
        },
      }, [m.name, "model"]);
    }

    return items.slice(0, 60);
  })();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
      const key = e.key.toLowerCase();

      if (paletteOpen) {
        if (key === "escape") {
          e.preventDefault();
          setPaletteOpen(false);
          return;
        }
        if (key === "arrowdown") {
          e.preventDefault();
          setPaletteIndex((prev) => Math.min(prev + 1, Math.max(0, paletteItems.length - 1)));
          return;
        }
        if (key === "arrowup") {
          e.preventDefault();
          setPaletteIndex((prev) => Math.max(0, prev - 1));
          return;
        }
        if (key === "enter") {
          e.preventDefault();
          const safeIndex = Math.min(paletteIndex, Math.max(0, paletteItems.length - 1));
          paletteItems[safeIndex]?.action();
          return;
        }
      }

      if (isInput || isModalOpen) return;

      if (key === "arrowdown") {
        e.preventDefault();
        if (filteredPrompts.length === 0) return;
        const idx = filteredPrompts.findIndex((p) => p.id === effectiveSelectedPromptId);
        const next = filteredPrompts[Math.min(filteredPrompts.length - 1, Math.max(0, idx + 1))];
        setSelectedPromptId(next.id);
      } else if (key === "arrowup") {
        e.preventDefault();
        if (filteredPrompts.length === 0) return;
        const idx = filteredPrompts.findIndex((p) => p.id === effectiveSelectedPromptId);
        const prev = filteredPrompts[Math.max(0, idx <= 0 ? 0 : idx - 1)];
        setSelectedPromptId(prev.id);
      } else if (key === "arrowright") {
        if (sortedFolders.length === 0) return;
        e.preventDefault();
        const currentIdx = selectedFolderId ? sortedFolders.findIndex((f) => f.id === selectedFolderId) : -1;
        const nextIdx = Math.min(sortedFolders.length - 1, Math.max(0, currentIdx + 1));
        const folder = sortedFolders[nextIdx];
        if (folder) {
          setSelectedFolderId(folder.id);
          setShowFavoritesOnly(false);
        }
      } else if (key === "arrowleft") {
        e.preventDefault();
        if (!selectedFolderId) {
          clearAllFilters();
          return;
        }
        const currentIdx = sortedFolders.findIndex((f) => f.id === selectedFolderId);
        if (currentIdx <= 0) {
          setSelectedFolderId(null);
        } else {
          const prevFolder = sortedFolders[currentIdx - 1];
          if (prevFolder) setSelectedFolderId(prevFolder.id);
        }
      } else if (key === "enter" && effectiveSelectedPromptId) {
        e.preventDefault();
        const p = filteredPrompts.find((item) => item.id === effectiveSelectedPromptId);
        if (p) {
          setModalPromptIds(filteredPrompts.map((item) => item.id));
          handleEditPrompt(p);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen, paletteItems, paletteIndex, isModalOpen, filteredPrompts, effectiveSelectedPromptId, handleEditPrompt, sortedFolders, selectedFolderId]);

  const filteredPromptIds = useMemo(() => filteredPrompts.map((p) => p.id), [filteredPrompts]);
  const activeSelectedForBulk = useMemo(
    () => selectedForBulk.filter((id) => filteredPromptIds.includes(id)),
    [selectedForBulk, filteredPromptIds]
  );
  const selectedCount = activeSelectedForBulk.length;
  const canBulkInFolder = !!selectedFolderId && viewMode === "grid";

  const toggleBulkSelection = (id: string) => {
    setSelectedForBulk((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAllInFolder = () => {
    setSelectedForBulk(filteredPromptIds);
  };

  const clearBulkSelection = () => {
    setSelectedForBulk([]);
  };

  const removeFromCurrentFolder = async (ids: string[]) => {
    if (!selectedFolderId || ids.length === 0) return;
    try {
      const updates = await Promise.all(ids.map((id) => unassignPromptFromFolder(id, selectedFolderId)));
      const byId = new Map(updates.map((u) => [u.id, u]));
      setPrompts((prev) => prev.map((p) => byId.get(p.id) || p));
      setSelectedForBulk([]);
      showToast(`Removed ${ids.length} prompt${ids.length === 1 ? "" : "s"} from folder`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove prompts", "error");
    }
  };

  // Transform prompts for display
  const displayPrompts = filteredPrompts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    coverUrl: p.primary_media?.original_url || null,
    coverType: (p.primary_media?.type as "image" | "video" | undefined) || "image",
    mediaItems: (p.media || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        url: m.original_url || "",
        type: m.type,
        frameFit: m.frame_fit as "cover" | "contain" | "fill",
        cropX: m.crop_x ?? 50,
        cropY: m.crop_y ?? 50,
        cropScale: m.crop_scale ?? 1,
      })),
    modelName: p.ai_model?.name || null,
    modelSlug: p.ai_model?.slug || null,
    modelCategory: p.ai_model?.category || null,
    contentType: p.content_type || null,
    isFavorite: p.is_favorite,
    tags: p.tags?.map((t) => t.name) || [],
    createdAt: p.created_at,
    folderIds: p.folder_ids || (p.folder_id ? [p.folder_id] : []),
  }));

  const editingIndex = editingPrompt ? modalPromptIds.findIndex((id) => id === editingPrompt.id) : -1;
  const canGoPrev = editingIndex > 0;
  const canGoNext = editingIndex >= 0 && editingIndex < modalPromptIds.length - 1;

  return (
    <>
      {/* Modals */}
      <CreatePromptModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccessModal}
        prompt={editingPrompt}
        models={models}
        folders={contextFolders}
        tags={tags}
        onTagsChange={setTags}
        onFolderCreate={addFolder}
        breadcrumb={selectedFolderId ? `All Prompts > ${contextFolders.find((f) => f.id === selectedFolderId)?.name || "Folder"} > ${editingPrompt?.title || ""}` : undefined}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={canGoPrev ? () => {
          const prevId = modalPromptIds[editingIndex - 1];
          const p = prompts.find((item) => item.id === prevId);
          if (p) {
            markPromptVisited(p.id);
            setEditingPrompt(p);
          }
        } : undefined}
        onNext={canGoNext ? () => {
          const nextId = modalPromptIds[editingIndex + 1];
          const p = prompts.find((item) => item.id === nextId);
          if (p) {
            markPromptVisited(p.id);
            setEditingPrompt(p);
          }
        } : undefined}
      />

      {paletteOpen && (
        <div className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-sm" onClick={() => setPaletteOpen(false)}>
          <div className="max-w-2xl mx-auto mt-[12vh] px-4" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-xl border border-surface-300 bg-surface shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-200">
                <input
                  ref={paletteInputRef}
                  value={paletteQuery}
                  onChange={(e) => {
                    setPaletteQuery(e.target.value);
                    setPaletteIndex(0);
                  }}
                  placeholder="Jump to prompt, folder, model, tag, or action..."
                  className="w-full bg-transparent text-sm text-foreground placeholder-text-dim focus:outline-none"
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                {paletteItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-dim">No results</div>
                ) : (
                  <div className="py-1">
                    {paletteItems.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between text-sm transition-colors ${
                          idx === paletteIndex ? "bg-brand-500/15 text-foreground" : "text-text-muted hover:bg-surface-100 hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="text-[11px] text-text-dim">{item.hint || item.group}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {activeFilterLabel}
            </h1>
            <p className="text-text-muted text-sm mt-1">
              {filteredPrompts.length === 0
                ? hasActiveFilters
                  ? "No prompts match your filters"
                  : "Manage and organize your creative prompt library"
                : hasActiveFilters
                  ? `${filteredPrompts.length} of ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}`
                  : `${prompts.length} prompt${prompts.length === 1 ? "" : "s"} total`}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-xs text-text-muted hover:text-foreground hover:border-surface-300 transition-colors"
            >
              Reset filters
            </button>
          )}
        </div>

        {canBulkInFolder && (
          <div className="sticky top-[57px] z-30 bg-background/95 backdrop-blur-sm border border-surface-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <span className="text-text-dim">Folder actions:</span>
            <button
              onClick={selectAllInFolder}
              className="px-2 py-1 rounded-md bg-surface-100 border border-surface-200 text-text-muted hover:text-foreground hover:border-surface-300"
            >
              Select all
            </button>
            <button
              onClick={() => removeFromCurrentFolder(activeSelectedForBulk)}
              disabled={selectedCount === 0}
              className="px-2 py-1 rounded-md bg-brand-500/12 border border-brand-500/25 text-brand-300 hover:bg-brand-500/20 disabled:opacity-40"
            >
              Remove selected ({selectedCount})
            </button>
            <button
              onClick={async () => {
                if (!selectedFolderId || filteredPromptIds.length === 0) return;
                if (!window.confirm("Remove all prompts from this folder?")) return;
                await removeFromCurrentFolder(filteredPromptIds);
              }}
              disabled={filteredPromptIds.length === 0}
              className="px-2 py-1 rounded-md bg-red-500/12 border border-red-500/25 text-red-300 hover:bg-red-500/20 disabled:opacity-40"
            >
              Remove all
            </button>
            <button
              onClick={clearBulkSelection}
              className="ml-auto px-2 py-1 rounded-md bg-surface-100 border border-surface-200 text-text-muted hover:text-foreground hover:border-surface-300"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Active Search Chip */}
        {searchQuery.trim() && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 border border-surface-200 text-xs text-text-muted hover:border-surface-300 hover:text-foreground transition-colors cursor-pointer group/chip"
            >
              Search: &quot;{searchQuery}&quot;
              <svg className="w-3 h-3 text-text-dim group-hover/chip:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Welcome guide — always rendered, component decides visibility via localStorage */}
        <WelcomeGuide onCreatePrompt={handleOpenModal} />

        {/* Content View */}
        {prompts.length === 0 && !hasActiveFilters ? (
          <EmptyState onCreateClick={handleOpenModal} />
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-text-dim mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-text-muted mb-2">
              {selectedFolderId ? "This folder is empty" : "No results found"}
            </h3>
            <p className="text-sm text-text-dim">
              {selectedFolderId ? "Drag prompts here or create one directly in this folder." : "Try adjusting your search or filters."}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              {selectedFolderId && (
                <button
                  onClick={handleOpenModal}
                  className="px-3 py-2 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 text-sm hover:bg-brand-500/25"
                >
                  Create prompt in this folder
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 rounded-lg bg-surface-100 border border-surface-200 text-text-muted text-sm hover:text-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <PromptGrid
            prompts={displayPrompts}
            onCopyPrompt={handleCopyPrompt}
            onFavoritePrompt={handleFavoritePrompt}
            selectedPromptId={effectiveSelectedPromptId}
            onSelectPrompt={setSelectedPromptId}
            selectable={canBulkInFolder}
            selectedIds={selectedForBulk}
            onToggleSelect={toggleBulkSelection}
            folders={contextFolders.map((f) => ({ id: f.id, name: f.name }))}
            selectedFolderId={selectedFolderId}
            onAssignPromptToFolder={async (promptId, folderId) => {
              try {
                const updated = await assignPromptToFolder(promptId, folderId);
                setPrompts((prev) => prev.map((p) => (p.id === promptId ? updated : p)));
                showToast(`Added to ${contextFolders.find((f) => f.id === folderId)?.name || "folder"}`, "success");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "Failed to assign folder", "error");
              }
            }}
            onRemovePromptFromCurrentFolder={selectedFolderId ? async (promptId) => {
              try {
                const updated = await unassignPromptFromFolder(promptId, selectedFolderId);
                setPrompts((prev) => prev.map((p) => (p.id === promptId ? updated : p)));
                showToast("Removed from current folder", "success");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "Failed to remove from folder", "error");
              }
            } : undefined}
            onClickPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) {
                setModalPromptIds(filteredPrompts.map((item) => item.id));
                handleEditPrompt(prompt);
              }
            }}
          />
        ) : (
          <PromptListView
            prompts={displayPrompts}
            onCopyPrompt={handleCopyPrompt}
            onFavoritePrompt={handleFavoritePrompt}
            selectedPromptId={effectiveSelectedPromptId}
            onSelectPrompt={setSelectedPromptId}
            onClickPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) {
                setModalPromptIds(filteredPrompts.map((item) => item.id));
                handleEditPrompt(prompt);
              }
            }}
          />
        )}
      </div>

      {/* Mobile FAB — New Prompt */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 z-40 sm:hidden w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-white shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-95 transition-all"
        aria-label="New Prompt"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 items-end">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg text-sm shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                toast.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                  : toast.type === 'error'
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                    : 'bg-brand-500/20 border border-brand-500/30 text-brand-300'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
