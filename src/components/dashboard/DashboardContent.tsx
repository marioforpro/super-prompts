"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PromptGrid } from "./PromptGrid";
import { PromptListView } from "./PromptListView";
import { EmptyState } from "./EmptyState";
import { CreatePromptModal } from "./CreatePromptModal";
import WelcomeGuide from "./WelcomeGuide";
import type { Prompt, AiModel, Folder, Tag } from "@/lib/types";
import { toggleFavorite, deletePrompt } from "@/lib/actions/prompts";
import { deleteFolder } from "@/lib/actions/folders";
import { deleteModel } from "@/lib/actions/models";
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
    models: contextModels,
    addFolder,
    removeFolder,
    removeModel,
    registerPromptFolderAssignHandler,
    markFolderVisited,
    markPromptVisited,
    setPromptIndex,
  } = useDashboard();

  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'info' | 'error' }>>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<
    | {
        type: "folder" | "model" | "prompt";
        id: string;
        name: string;
        promptCount: number;
      }
    | null
  >(null);
  const toastIdRef = useRef(0);

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
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to update favorite"
        );
      }
    },
    [prompts, showToast]
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

  const hasActiveFilters = !!(searchQuery.trim() || selectedFolderId || selectedModelSlug || selectedTags.length > 0 || selectedContentType || showFavoritesOnly);
  const selectedFolder = useMemo(
    () => contextFolders.find((folder) => folder.id === selectedFolderId) || null,
    [contextFolders, selectedFolderId]
  );
  const selectedModel = useMemo(
    () => contextModels.find((model) => model.slug === selectedModelSlug) || null,
    [contextModels, selectedModelSlug]
  );
  const selectedFolderPromptCount = useMemo(() => {
    if (!selectedFolder) return 0;
    return prompts.filter((p) =>
      (p.folder_ids && p.folder_ids.length > 0)
        ? p.folder_ids.includes(selectedFolder.id)
        : p.folder_id === selectedFolder.id
    ).length;
  }, [prompts, selectedFolder]);
  const selectedModelPromptCount = useMemo(() => {
    if (!selectedModel) return 0;
    return prompts.filter((p) => p.ai_model?.slug === selectedModel.slug).length;
  }, [prompts, selectedModel]);
  const selectedContextHasItems = selectedFolder
    ? selectedFolderPromptCount > 0
    : selectedModel
      ? selectedModelPromptCount > 0
      : false;

  const effectiveSelectedPromptId = selectedPromptId && filteredPrompts.some((p) => p.id === selectedPromptId)
    ? selectedPromptId
    : (filteredPrompts[0]?.id || null);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedFolderId(null);
    setSelectedModelSlug(null);
    setSelectedTags([]);
    setSelectedContentType(null);
    setShowFavoritesOnly(false);
  };

  const handleDeleteSelectedFolder = useCallback(async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      removeFolder(folderId);
      setPrompts((prev) =>
        prev.map((prompt) => ({
          ...prompt,
          folder_id: prompt.folder_id === folderId ? null : prompt.folder_id,
          folder_ids: (prompt.folder_ids || []).filter((itemFolderId) => itemFolderId !== folderId),
        }))
      );
      setSelectedFolderId(null);
      showToast("Folder deleted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete folder", "error");
    }
  }, [removeFolder, setSelectedFolderId, showToast]);

  const handleDeleteSelectedModel = useCallback(async (modelId: string) => {
    try {
      await deleteModel(modelId);
      removeModel(modelId);
      setPrompts((prev) =>
        prev.map((prompt) =>
          prompt.ai_model?.id === modelId
            ? { ...prompt, model_id: null, ai_model: null, content_type: null }
            : prompt
        )
      );
      setSelectedModelSlug(null);
      showToast("AI model deleted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete AI model", "error");
    }
  }, [removeModel, setSelectedModelSlug, showToast]);

  const handleOpenDeleteConfirm = useCallback(() => {
    if (selectedFolder) {
      setDeleteConfirm({
        type: "folder",
        id: selectedFolder.id,
        name: selectedFolder.name,
        promptCount: selectedFolderPromptCount,
      });
      return;
    }
    if (selectedModel) {
      setDeleteConfirm({
        type: "model",
        id: selectedModel.id,
        name: selectedModel.name,
        promptCount: selectedModelPromptCount,
      });
    }
  }, [selectedFolder, selectedModel, selectedFolderPromptCount, selectedModelPromptCount]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "folder") {
      await handleDeleteSelectedFolder(deleteConfirm.id);
    } else if (deleteConfirm.type === "model") {
      await handleDeleteSelectedModel(deleteConfirm.id);
    } else {
      try {
        await deletePrompt(deleteConfirm.id);
        setPrompts((prev) => prev.filter((prompt) => prompt.id !== deleteConfirm.id));
        if (selectedPromptId === deleteConfirm.id) {
          setSelectedPromptId(null);
        }
        showToast("Prompt deleted", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to delete prompt", "error");
      }
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, handleDeleteSelectedFolder, handleDeleteSelectedModel, selectedPromptId, showToast]);

  const handleDeletePromptFromCard = useCallback(
    (id: string) => {
      const prompt = prompts.find((item) => item.id === id);
      setDeleteConfirm({
        type: "prompt",
        id,
        name: prompt?.title || "this prompt",
        promptCount: 0,
      });
    },
    [prompts]
  );

  const handleSharePromptFromCard = useCallback(
    async (id: string) => {
      const prompt = prompts.find((item) => item.id === id);
      if (!prompt) return;
      const shareText = `${prompt.title}\n\n${prompt.content}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: prompt.title, text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          showToast("Prompt copied for sharing", "success");
        }
      } catch {
        // User canceled share sheet; no toast needed.
      }
    },
    [prompts, showToast]
  );

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
      />

      {/* Main Content */}
      <div className="space-y-1 animate-fadeIn">

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
            selectable={false}
            selectedIds={[]}
            onClickPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) {
                handleEditPrompt(prompt);
              }
            }}
            onEditPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) handleEditPrompt(prompt);
            }}
            onSharePrompt={(id) => void handleSharePromptFromCard(id)}
            onDeletePrompt={(id) => void handleDeletePromptFromCard(id)}
          />
        ) : (
          <PromptListView
            prompts={displayPrompts}
            onCopyPrompt={handleCopyPrompt}
            onFavoritePrompt={handleFavoritePrompt}
            onEditPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) handleEditPrompt(prompt);
            }}
            onSharePrompt={(id) => void handleSharePromptFromCard(id)}
            onDeletePrompt={(id) => void handleDeletePromptFromCard(id)}
            selectedPromptId={effectiveSelectedPromptId}
            onSelectPrompt={setSelectedPromptId}
            onClickPrompt={(id) => {
              const prompt = filteredPrompts.find((p) => p.id === id) || prompts.find((p) => p.id === id);
              if (prompt) {
                handleEditPrompt(prompt);
              }
            }}
          />
        )}

        {(selectedFolder || selectedModel) && (
          <div className="fixed bottom-5 left-1/2 md:left-[calc(50%+8rem)] z-30 -translate-x-1/2">
            <button
              onClick={handleOpenDeleteConfirm}
              className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium backdrop-blur-sm transition-colors ${
                selectedContextHasItems
                  ? "border-red-500/20 bg-red-500/6 text-red-400/45 hover:bg-red-500/12 hover:text-red-300/80"
                  : "border-red-500/25 bg-red-500/10 text-red-500/80 hover:bg-red-500/15 hover:text-red-400"
              }`}
            >
              {selectedFolder ? "Delete folder" : "Delete AI model"}
            </button>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <div className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-[linear-gradient(180deg,rgba(22,24,37,0.98)_0%,rgba(17,19,31,0.99)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.55)] p-5">
              <h3 className="text-base font-semibold text-foreground">
                Delete {deleteConfirm.type === "folder" ? "folder" : deleteConfirm.type === "model" ? "AI model" : "prompt"}
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                {`You are deleting "${deleteConfirm.name}".`}
              </p>
              {deleteConfirm.type !== "prompt" && deleteConfirm.promptCount > 0 && (
                <p className="mt-2 text-sm text-red-300/90">
                  Warning: this will affect {deleteConfirm.promptCount} prompt{deleteConfirm.promptCount === 1 ? "" : "s"}.
                </p>
              )}
              <p className="mt-2 text-xs text-text-dim">
                This action cannot be undone.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="h-9 px-3 rounded-lg border border-surface-200 bg-surface-100 text-sm text-text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleConfirmDelete()}
                  className="h-9 px-3 rounded-lg border border-red-500/30 bg-red-500/14 text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 right-5 z-50 flex flex-col-reverse gap-2 items-end">
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
