"use client";

import { useState, useCallback, useEffect } from "react";
import { PromptGrid } from "./PromptGrid";
import { PromptListView } from "./PromptListView";
import { EmptyState } from "./EmptyState";
import { CreatePromptModal } from "./CreatePromptModal";
import type { Prompt, AiModel, Folder, Tag } from "@/lib/types";
import { toggleFavorite } from "@/lib/actions/prompts";

interface DashboardContentProps {
  initialPrompts: Prompt[];
  models: AiModel[];
  folders: Folder[];
  tags: Tag[];
  viewMode: "grid" | "list";
  onModalOpen?: (callback: () => void) => void;
}

export function DashboardContent({
  initialPrompts,
  models,
  folders,
  tags: initialTags,
  viewMode,
  onModalOpen,
}: DashboardContentProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [copyToast, setCopyToast] = useState("");

  // Register modal open callback with parent
  useEffect(() => {
    onModalOpen?.(() => {
      setEditingPrompt(null);
      setIsModalOpen(true);
    });
  }, [onModalOpen]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const showCopyToast = (message: string) => {
    setCopyToast(message);
    setTimeout(() => setCopyToast(""), 2000);
  };

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

  // Transform prompts for display
  const displayPrompts = prompts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    coverUrl: p.primary_media?.original_url || null,
    coverType: (p.primary_media?.type as "image" | "video" | undefined) || "image",
    modelName: p.ai_model?.name || null,
    modelSlug: p.ai_model?.slug || null,
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
        folders={folders}
        tags={tags}
        onTagsChange={setTags}
      />

      {/* Main Content */}
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              All Prompts
            </h1>
            <p className="text-text-muted text-sm mt-1">
              {prompts.length === 0
                ? "Manage and organize your creative prompt library"
                : `${prompts.length} prompt${prompts.length === 1 ? "" : "s"} total`}
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 text-white rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 font-medium text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Prompt</span>
          </button>
        </div>

        {/* Content View */}
        {prompts.length === 0 ? (
          <EmptyState onCreateClick={handleOpenModal} />
        ) : viewMode === "grid" ? (
          <PromptGrid
            prompts={displayPrompts}
            onCopyPrompt={handleCopyPrompt}
            onFavoritePrompt={handleFavoritePrompt}
            onClickPrompt={(id) => {
              const prompt = prompts.find((p) => p.id === id);
              if (prompt) handleEditPrompt(prompt);
            }}
          />
        ) : (
          <PromptListView
            prompts={displayPrompts}
            onCopyPrompt={handleCopyPrompt}
            onFavoritePrompt={handleFavoritePrompt}
            onClickPrompt={(id) => {
              const prompt = prompts.find((p) => p.id === id);
              if (prompt) handleEditPrompt(prompt);
            }}
          />
        )}
      </div>

      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          {copyToast}
        </div>
      )}

      {/* General Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 px-4 py-3 rounded-lg bg-brand-500/20 border border-brand-500/30 text-brand-300 text-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toastMessage}
        </div>
      )}
    </>
  );
}
