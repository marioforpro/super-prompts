"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ImagePlus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import type { Prompt, AiModel, Folder, Tag } from "@/lib/types";
import {
  createPrompt,
  updatePrompt,
  deletePrompt,
} from "@/lib/actions/prompts";
import { createTag } from "@/lib/actions/tags";
import { createPromptMedia, removePromptMedia } from "@/lib/actions/media";
import { createClient } from "@/lib/supabase/client";

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (prompt: Prompt) => void;
  prompt?: Prompt | null;
  models: AiModel[];
  folders: Folder[];
  tags: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
}

export function CreatePromptModal({
  isOpen,
  onClose,
  onSuccess,
  prompt,
  models,
  folders,
  tags,
  onTagsChange,
}: CreatePromptModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [modelId, setModelId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSearchingModels, setIsSearchingModels] = useState(false);
  const [filteredModels, setFilteredModels] = useState<AiModel[]>(models);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingMediaId, setExistingMediaId] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Initialize form with existing prompt data
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setModelId(prompt.model_id || null);
      setFolderId(prompt.folder_id || null);
      setNotes(prompt.notes || "");
      setSourceUrl(prompt.source_url || "");
      setSelectedTags(prompt.tags?.map((t) => t.id) || []);
      // Set existing thumbnail
      if (prompt.primary_media?.original_url) {
        setThumbnailPreview(prompt.primary_media.original_url);
        setExistingMediaId(prompt.primary_media.id);
      } else {
        setThumbnailPreview(null);
        setExistingMediaId(null);
      }
      setThumbnailFile(null);
    } else {
      resetForm();
    }
    setError("");
  }, [prompt, isOpen]);

  // Cmd/Ctrl+Enter to submit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isLoading) {
        e.preventDefault();
        const form = document.querySelector<HTMLFormElement>('form');
        if (form) form.requestSubmit();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading]);

  // Cleanup blob URLs when modal closes
  useEffect(() => {
    if (!isOpen && thumbnailPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
  }, [isOpen]);

  // Handle model search
  useEffect(() => {
    if (tagInput && isSearchingModels) {
      const filtered = models.filter((m) =>
        m.name.toLowerCase().includes(tagInput.toLowerCase())
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(models);
    }
  }, [tagInput, models, isSearchingModels]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setModelId(null);
    setFolderId(null);
    setNotes("");
    setSourceUrl("");
    setSelectedTags([]);
    setTagInput("");
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setExistingMediaId(null);
  };

  // Validate and process a file (shared by input and drag-drop)
  const processFile = (file: File) => {
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const allValidTypes = [...validImageTypes, ...validVideoTypes];

    if (!allValidTypes.includes(file.type)) {
      setError("Please upload an image (JPG, PNG, WebP, GIF) or video (MP4, WebM, MOV)");
      return;
    }

    // Max 5MB for images, 50MB for videos
    const isVideo = validVideoTypes.includes(file.type);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(isVideo ? "Video must be under 50MB" : "Image must be under 5MB");
      return;
    }

    setThumbnailFile(file);
    setError("");

    // Create preview
    if (isVideo) {
      // For video, create a blob URL for preview
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbnailPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file selection from input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Remove thumbnail
  const handleRemoveThumbnail = () => {
    // Revoke any object URL to prevent memory leaks
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload thumbnail to Supabase Storage (client-side)
  const uploadThumbnail = async (promptId: string): Promise<void> => {
    if (!thumbnailFile) return;

    setIsUploadingThumbnail(true);
    try {
      const supabase = createClient();

      // Generate unique file path
      const ext = thumbnailFile.name.split(".").pop() || "jpg";
      const timestamp = Date.now();
      const storagePath = `${promptId}/${timestamp}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("prompt-media")
        .upload(storagePath, thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Determine media type from the actual file type
      const isVideoFile = thumbnailFile.type.startsWith("video/");
      const mediaType: "image" | "video" = isVideoFile ? "video" : "image";

      // If there's an existing media, remove it first
      if (existingMediaId) {
        try {
          await removePromptMedia(promptId, existingMediaId);
        } catch {
          // Non-fatal: continue even if old media cleanup fails
        }
      }

      // Create DB record and set as primary
      await createPromptMedia(
        promptId,
        storagePath,
        mediaType,
        thumbnailFile.size,
        true
      );
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleAddTag = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
        e.preventDefault();
        const tagName = tagInput.trim().replace(/,/, "");

        // Check if tag already exists
        const existingTag = tags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        );

        if (existingTag) {
          if (!selectedTags.includes(existingTag.id)) {
            setSelectedTags([...selectedTags, existingTag.id]);
          }
        } else {
          // Create new tag
          try {
            const newTag = await createTag(tagName);
            setSelectedTags([...selectedTags, newTag.id]);
            onTagsChange?.([...tags, newTag]);
          } catch (err) {
            setError(
              `Failed to create tag: ${err instanceof Error ? err.message : ""}`
            );
          }
        }

        setTagInput("");
      }
    },
    [tagInput, tags, selectedTags, onTagsChange]
  );

  const removeTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter((id) => id !== tagId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!title.trim()) {
        setError("Title is required");
        return;
      }

      if (!content.trim()) {
        setError("Prompt content is required");
        return;
      }

      const input = {
        title: title.trim(),
        content: content.trim(),
        model_id: modelId,
        folder_id: folderId,
        notes: notes.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
        tag_ids: selectedTags,
      };

      let result;
      if (prompt) {
        result = await updatePrompt(prompt.id, input);
      } else {
        result = await createPrompt(input);
      }

      // Upload thumbnail if a new file was selected
      if (thumbnailFile && result?.id) {
        try {
          await uploadThumbnail(result.id);
        } catch (err) {
          console.error("Thumbnail upload failed:", err);
          // Non-fatal — prompt was saved, just thumbnail failed
        }
      }

      // If user removed thumbnail (preview is null but there was an existing media)
      if (!thumbnailPreview && existingMediaId && prompt) {
        try {
          await removePromptMedia(prompt.id, existingMediaId);
        } catch {
          // Non-fatal
        }
      }

      onSuccess?.(result);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!prompt) return;

    setIsLoading(true);
    try {
      await deletePrompt(prompt.id);
      onSuccess?.(null as any);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete prompt");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  const selectedTagObjects = tags.filter((t) => selectedTags.includes(t.id));

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-surface border-l border-surface-200 shadow-2xl shadow-black/40 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-foreground">
            {prompt ? "Edit Prompt" : "Create Prompt"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Thumbnail Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Cover Media
            </label>
            <div
              ref={dropZoneRef}
              className="relative"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {thumbnailPreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-surface-200">
                  <div className="relative w-full aspect-video bg-surface-100">
                    {thumbnailFile?.type.startsWith("video/") ? (
                      <video
                        src={thumbnailPreview}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                        unoptimized={thumbnailPreview.startsWith("data:") || thumbnailPreview.startsWith("blob:")}
                      />
                    )}
                  </div>
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-colors"
                      title="Change thumbnail"
                      disabled={isLoading}
                    >
                      <ImagePlus size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="p-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/30 text-red-300 transition-colors"
                      title="Remove thumbnail"
                      disabled={isLoading}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group ${
                    isDragging
                      ? "border-brand-400 bg-brand-500/15 scale-[1.01]"
                      : "border-surface-300 hover:border-brand-400/60 bg-surface-100/50 hover:bg-surface-100"
                  }`}
                  disabled={isLoading}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isDragging
                      ? "bg-brand-500/20"
                      : "bg-surface-200 group-hover:bg-brand-500/10"
                  }`}>
                    {isDragging ? (
                      <Upload size={22} className="text-brand-400" />
                    ) : (
                      <ImagePlus
                        size={22}
                        className="text-text-dim group-hover:text-brand-400 transition-colors"
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-text-muted font-medium">
                      {isDragging ? "Drop file here" : "Click or drag to upload"}
                    </p>
                    <p className="text-xs text-text-dim mt-1">
                      JPG, PNG, WebP, GIF (5MB) or MP4, WebM, MOV (50MB)
                    </p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter prompt title"
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          {/* Prompt Content */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Prompt *
              </label>
              <span className="text-xs text-text-dim">
                {content.length} characters
              </span>
            </div>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt text here"
              rows={8}
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all resize-none disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          {/* AI Model */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              AI Model
            </label>
            <select
              value={modelId || ""}
              onChange={(e) => setModelId(e.target.value || null)}
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Select a model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Folder */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Folder
            </label>
            <select
              value={folderId || ""}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Unfiled</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag name, press Enter to add"
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all disabled:opacity-50 mb-3"
              disabled={isLoading}
            />
            {selectedTagObjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTagObjects.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-sm text-foreground"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="hover:opacity-70 transition-opacity"
                      disabled={isLoading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes about this prompt"
              rows={4}
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all resize-none disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          {/* Source URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Source URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-surface-200 p-6 bg-surface/50 backdrop-blur-sm flex items-center justify-between gap-3">
          {prompt && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
              disabled={isLoading || showDeleteConfirm}
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 hover:bg-surface-100 rounded-lg transition-colors font-medium text-sm text-text-muted disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2.5 bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 disabled:from-brand-500/50 disabled:to-brand-500/50 text-white rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 disabled:shadow-brand-500/10 font-medium text-sm"
            >
              {isLoading
                ? isUploadingThumbnail
                  ? "Uploading..."
                  : "Saving..."
                : prompt
                  ? "Update"
                  : "Create"}
              {!isLoading && (
                <kbd className="hidden sm:inline ml-2 px-1 py-0.5 rounded bg-white/10 text-[10px] font-mono">⌘↵</kbd>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm bg-surface border border-surface-200 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Delete Prompt?
                </h3>
                <p className="text-sm text-text-muted mb-6">
                  This action cannot be undone. The prompt and all its associated
                  data will be permanently deleted.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 hover:bg-surface-100 rounded-lg transition-colors font-medium text-sm text-text-muted disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {isLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
