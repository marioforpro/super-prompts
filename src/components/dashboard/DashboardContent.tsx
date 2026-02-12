"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PromptGrid } from "./PromptGrid";
import { PromptListView } from "./PromptListView";
import { EmptyState } from "./EmptyState";
import { CreatePromptModal } from "./CreatePromptModal";
import type { Prompt, AiModel, Folder, Tag } from "@/lib/types";
import { toggleFavorite } from "@/lib/actions/prompts";
import { useDashboard } from "@/contexts/DashboardContext";
import { fuzzySearchFields } from "@/lib/fuzzySearch";

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
  const {
    viewMode,
    searchQuery,
    selectedFolderId,
    selectedModelSlug,
    selectedTag,
    showFavoritesOnly,
    folders: contextFolders,
    addFolder,
  } = useDashboard();

  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'info' | 'error' }>>([]);
  const toastIdRef = useRef(0);

  // Register modal open callback with parent
  useEffect(() => {
    onModalOpen?.(() => {
      setEditingPrompt(null);
      setIsModalOpen(true);
    });
  }, [onModalOpen]);

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
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrompt(null);
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
      showToast("Prompt updated successfully");
    } else {
      // Add new prompt
      setPrompts([updatedPrompt, ...prompts]);
      showToast("Prompt created successfully");
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

  const handleDeletePrompt = useCallback((id: string) => {
    setPrompts(prompts.filter((p) => p.id !== id));
    showToast("Prompt deleted successfully");
  }, [prompts]);

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
      result = result.filter((p) => p.folder_id === selectedFolderId);
    }

    // Model filter
    if (selectedModelSlug) {
      result = result.filter((p) => p.ai_model?.slug === selectedModelSlug);
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((p) =>
        p.tags?.some((t) => t.name === selectedTag)
      );
    }

    // Favorites only
    if (showFavoritesOnly) {
      result = result.filter((p) => p.is_favorite);
    }

    return result;
  }, [prompts, searchQuery, selectedFolderId, selectedModelSlug, selectedTag, showFavoritesOnly]);

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
    if (selectedTag) return `#${selectedTag}`;
    return "All Prompts";
  }, [showFavoritesOnly, selectedFolderId, selectedModelSlug, selectedTag, contextFolders, models]);

  const hasActiveFilters = !!(searchQuery.trim() || selectedFolderId || selectedModelSlug || selectedTag || showFavoritesOnly);

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
        cropX: 50,
        cropY: 50,
        cropScale: 1,
      })),
    modelName: p.ai_model?.name || null,
    modelSlug: p.ai_model?.slug || null,
    modelCategory: p.ai_model?.category || null,
    isFavorite: p.is_favorite,
    tags: p.tags?.map((t) => t.name) || [],
  }));

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
      />

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
        </div>

        {/* Active Filters Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 border border-surface-200 text-xs text-text-muted">
                Search: &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedFolderId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 border border-surface-200 text-xs text-text-muted">
                Folder: {contextFolders.find((f) => f.id === selectedFolderId)?.name}
              </span>
            )}
            {selectedModelSlug && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 border border-surface-200 text-xs text-text-muted">
                Model: {models.find((m) => m.slug === selectedModelSlug)?.name}
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 border border-surface-200 text-xs text-text-muted">
                #{selectedTag}
              </span>
            )}
            {showFavoritesOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-400">
                Favorites only
              </span>
            )}
          </div>
        )}

        {/* Content View */}
        {prompts.length === 0 && !hasActiveFilters ? (
          <EmptyState onCreateClick={handleOpenModal} />
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-text-dim mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-text-muted mb-2">No results found</h3>
            <p className="text-sm text-text-dim">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <PromptGrid
            prompts={displayPrompts}
            onCopyPrompt={handleCopyPrompt}
            onFavoritePrompt={handleFavoritePrompt}
            onClickPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) handleEditPrompt(prompt);
            }}
          />
        ) : (
          <PromptListView
            prompts={displayPrompts}
            onCopyPrompt={handleCopyPrompt}
            onFavoritePrompt={handleFavoritePrompt}
            onClickPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) handleEditPrompt(prompt);
            }}
          />
        )}
      </div>

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
