"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ImagePlus, Upload } from "lucide-react";
import Image from "next/image";
import type { Prompt, AiModel, Folder, Tag, FrameFit } from "@/lib/types";
import {
  createPrompt,
  updatePrompt,
  deletePrompt,
  getPrompt,
} from "@/lib/actions/prompts";
import { createTag } from "@/lib/actions/tags";
import { createFolder } from "@/lib/actions/folders";
import { createPromptMedia, removePromptMedia, updateMediaFrameFit } from "@/lib/actions/media";
import { createClient } from "@/lib/supabase/client";

interface LocalMediaItem {
  id?: string; // Existing DB media ID
  file?: File; // New file to upload
  preview: string; // Preview URL
  type: 'image' | 'video';
  frameFit: FrameFit;
  sortOrder: number;
  cropX: number; // 0-100, percentage from left
  cropY: number; // 0-100, percentage from top
  cropScale: number; // 1.0 = default, 1.5 = 150%, etc.
}

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (prompt: Prompt) => void;
  prompt?: Prompt | null;
  models: AiModel[];
  folders: Folder[];
  tags: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  onFolderCreate?: (folder: Folder) => void;
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
  onFolderCreate,
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

  // Inline folder creation
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderCreateError, setFolderCreateError] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Media gallery state
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
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

      // Load media items
      if (prompt.media && prompt.media.length > 0) {
        const sorted = [...prompt.media].sort((a, b) => a.sort_order - b.sort_order);
        setMediaItems(sorted.map((m, i) => ({
          id: m.id,
          preview: m.original_url || '',
          type: m.type,
          frameFit: m.frame_fit,
          sortOrder: i,
          cropX: 50,
          cropY: 50,
          cropScale: 1,
        })));
      } else if (prompt.primary_media?.original_url) {
        // Fallback to primary_media
        setMediaItems([{
          id: prompt.primary_media.id,
          preview: prompt.primary_media.original_url,
          type: prompt.primary_media.type,
          frameFit: prompt.primary_media.frame_fit || 'cover',
          sortOrder: 0,
          cropX: 50,
          cropY: 50,
          cropScale: 1,
        }]);
      } else {
        setMediaItems([]);
      }
      setRemovedMediaIds([]);
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
    if (!isOpen) {
      mediaItems.forEach(m => {
        if (m.preview.startsWith("blob:")) URL.revokeObjectURL(m.preview);
      });
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
    setMediaItems([]);
    setRemovedMediaIds([]);
  };

  // Validate and process multiple files
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const allValidTypes = [...validImageTypes, ...validVideoTypes];

    const newItems: LocalMediaItem[] = [];
    let currentMaxOrder = mediaItems.length > 0 ? Math.max(...mediaItems.map(m => m.sortOrder)) + 1 : 0;

    for (const file of fileArray) {
      if (!allValidTypes.includes(file.type)) {
        setError("Unsupported file type. Use JPG, PNG, WebP, GIF, MP4, WebM, or MOV.");
        continue;
      }
      const isVideo = validVideoTypes.includes(file.type);
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(isVideo ? "Video must be under 50MB" : "Image must be under 5MB");
        continue;
      }

      const preview = URL.createObjectURL(file);
      newItems.push({
        file,
        preview,
        type: isVideo ? 'video' : 'image',
        frameFit: 'cover',
        sortOrder: currentMaxOrder++,
        cropX: 50,
        cropY: 50,
        cropScale: 1,
      });
    }

    if (newItems.length > 0) {
      setMediaItems(prev => [...prev, ...newItems]);
      setError("");
    }
  };

  // Handle file selection from input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processFiles(files);
  };

  // Remove media at index
  const handleRemoveMedia = (index: number) => {
    const item = mediaItems[index];
    // Track removed existing items
    if (item.id) {
      setRemovedMediaIds(prev => [...prev, item.id!]);
    }
    // Revoke blob URL
    if (item.preview.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
    }
    setMediaItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-index sort orders
      return updated.map((m, i) => ({ ...m, sortOrder: i }));
    });
  };

  // Update frame fit for a media item
  const handleFrameFitChange = (index: number, fit: FrameFit) => {
    setMediaItems(prev => prev.map((m, i) => i === index ? { ...m, frameFit: fit } : m));
  };

  // Focus inline folder input when creating
  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  // Handle inline folder creation
  const handleInlineFolderCreate = async () => {
    if (!newFolderName.trim()) {
      setIsCreatingFolder(false);
      setNewFolderName("");
      return;
    }
    setFolderCreateError("");
    try {
      const folder = await createFolder(newFolderName.trim());
      onFolderCreate?.(folder);
      setFolderId(folder.id);
      setIsCreatingFolder(false);
      setNewFolderName("");
    } catch (err) {
      setFolderCreateError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  // Set a media item as the cover (move to index 0)
  const handleSetCover = (index: number) => {
    if (index === 0) return; // Already the cover
    setMediaItems(prev => {
      const items = [...prev];
      const [item] = items.splice(index, 1);
      items.unshift(item);
      return items.map((m, i) => ({ ...m, sortOrder: i }));
    });
  };

  // Upload all media (new files and updates)
  const uploadAllMedia = async (promptId: string): Promise<void> => {
    setIsUploadingMedia(true);
    try {
      const supabase = createClient();

      // 1. Remove deleted existing media
      for (const mediaId of removedMediaIds) {
        try {
          await removePromptMedia(promptId, mediaId);
        } catch {
          // Non-fatal
        }
      }

      // 2. Update frame_fit for existing items that changed
      for (const item of mediaItems) {
        if (item.id && !item.file) {
          // Check if frame_fit changed — always update to be safe
          try {
            await updateMediaFrameFit(item.id, item.frameFit);
          } catch {
            // Non-fatal
          }
        }
      }

      // 3. Upload new files
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        if (!item.file) continue; // Skip existing items

        const ext = item.file.name.split(".").pop() || "jpg";
        const timestamp = Date.now();
        const storagePath = `${promptId}/${timestamp}_${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("prompt-media")
          .upload(storagePath, item.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload failed for file:", item.file.name, uploadError);
          continue;
        }

        // Create DB record — first item is primary
        const isFirst = i === 0 && !mediaItems.some((m, j) => j < i && m.id);
        await createPromptMedia(
          promptId,
          storagePath,
          item.type,
          item.file.size,
          isFirst && !mediaItems.some(m => m.id), // Only set as primary if no existing items
          item.sortOrder,
          item.frameFit
        );
      }
    } finally {
      setIsUploadingMedia(false);
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

      // Upload/manage media
      if (result?.id && (mediaItems.some(m => m.file) || removedMediaIds.length > 0 || mediaItems.some(m => m.id))) {
        try {
          await uploadAllMedia(result.id);
          // Re-fetch to get updated media relations
          result = await getPrompt(result.id);
        } catch (err) {
          console.error("Media upload failed:", err);
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

          {/* Media Gallery */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Media
              {mediaItems.length > 0 && (
                <span className="ml-2 text-xs text-text-dim font-normal">
                  {mediaItems.length} file{mediaItems.length !== 1 ? 's' : ''} · drag on image to reposition, use slider to zoom
                </span>
              )}
            </label>

            {mediaItems.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {mediaItems.map((item, index) => (
                  <div key={`${item.id || ''}-${item.preview}-${index}`} className="relative group">
                    {/* Thumbnail — draggable for crop repositioning in crop mode */}
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-surface-200 bg-surface-100">
                      {item.type === 'video' ? (
                        <video
                          src={item.preview}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <Image
                          src={item.preview}
                          alt={`Media ${index + 1}`}
                          fill
                          className="object-cover pointer-events-none"
                          style={{
                            objectPosition: `${item.cropX}% ${item.cropY}%`,
                            transform: `scale(${item.cropScale})`,
                            transformOrigin: `${item.cropX}% ${item.cropY}%`,
                          }}
                          unoptimized={item.preview.startsWith("data:") || item.preview.startsWith("blob:")}
                        />
                      )}

                      {/* Drag-to-reposition overlay — uses pointer capture for reliable drag */}
                      {item.type === 'image' && (
                        <div
                          className="absolute inset-0 cursor-move z-10 touch-none"
                          title="Drag to reposition image"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.target as HTMLElement).setPointerCapture(e.pointerId);
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startCropX = item.cropX;
                            const startCropY = item.cropY;
                            const el = e.target as HTMLElement;
                            const onMove = (ev: PointerEvent) => {
                              const dx = (ev.clientX - startX) * -0.5;
                              const dy = (ev.clientY - startY) * -0.5;
                              const newX = Math.max(0, Math.min(100, startCropX + dx));
                              const newY = Math.max(0, Math.min(100, startCropY + dy));
                              setMediaItems(prev => prev.map((m, i) => i === index ? { ...m, cropX: newX, cropY: newY } : m));
                            };
                            const onUp = () => {
                              el.removeEventListener('pointermove', onMove);
                              el.removeEventListener('pointerup', onUp);
                            };
                            el.addEventListener('pointermove', onMove);
                            el.addEventListener('pointerup', onUp);
                          }}
                        />
                      )}

                      {/* Cover badge */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-500/80 text-white pointer-events-none">
                          Cover
                        </div>
                      )}

                      {/* Set as cover button — only on non-cover items */}
                      {index !== 0 && mediaItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(index)}
                          className="absolute bottom-1 left-1 z-20 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 hover:bg-brand-500/80 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Set as cover image"
                        >
                          Set cover
                        </button>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="absolute top-1 right-1 z-20 p-1 rounded-md bg-black/50 hover:bg-red-500/70 text-white opacity-0 group-hover:opacity-100 transition-all"
                        disabled={isLoading}
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Zoom slider + Reset */}
                    {item.type === 'image' && (
                      <div className="mt-1.5 space-y-1">
                        <input
                          type="range"
                          min="100"
                          max="200"
                          value={item.cropScale * 100}
                          onChange={(e) => {
                            const newScale = parseInt(e.target.value) / 100;
                            setMediaItems(prev => prev.map((m, i) => i === index ? { ...m, cropScale: newScale } : m));
                          }}
                          className="w-full h-1 accent-brand-400 cursor-pointer"
                          title={`Zoom: ${Math.round(item.cropScale * 100)}%`}
                        />
                        {(item.cropScale !== 1 || item.cropX !== 50 || item.cropY !== 50) && (
                          <button
                            type="button"
                            onClick={() => {
                              setMediaItems(prev => prev.map((m, i) => i === index ? { ...m, cropX: 50, cropY: 50, cropScale: 1 } : m));
                            }}
                            className="w-full py-0.5 rounded text-[10px] font-medium text-text-dim hover:text-foreground bg-surface-100 hover:bg-surface-200 transition-colors cursor-pointer text-center"
                            title="Reset zoom and position"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex flex-col items-center justify-center gap-2 ${
                  mediaItems.length > 0 ? 'py-4' : 'py-8'
                } border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group ${
                  isDragging
                    ? "border-brand-400 bg-brand-500/15 scale-[1.01]"
                    : "border-surface-300 hover:border-brand-400/60 bg-surface-100/50 hover:bg-surface-100"
                }`}
                disabled={isLoading}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDragging ? "bg-brand-500/20" : "bg-surface-200 group-hover:bg-brand-500/10"
                }`}>
                  {isDragging ? (
                    <Upload size={18} className="text-brand-400" />
                  ) : (
                    <ImagePlus size={18} className="text-text-dim group-hover:text-brand-400 transition-colors" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-muted font-medium">
                    {isDragging ? "Drop files here" : mediaItems.length > 0 ? "Add more media" : "Click or drag to upload"}
                  </p>
                  <p className="text-xs text-text-dim mt-0.5">
                    JPG, PNG, WebP, GIF (5MB) or MP4, WebM, MOV (50MB)
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
                multiple
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
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setIsCreatingFolder(true);
                  e.target.value = folderId || "";
                } else {
                  setFolderId(e.target.value || null);
                }
              }}
              className="w-full px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-foreground focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">All Prompts</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
              <option value="__new__">+ Create new folder...</option>
            </select>

            {/* Inline folder creation */}
            {isCreatingFolder && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={newFolderInputRef}
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleInlineFolderCreate(); }
                    else if (e.key === "Escape") { setIsCreatingFolder(false); setNewFolderName(""); setFolderCreateError(""); }
                  }}
                  placeholder="Folder name..."
                  className="flex-1 px-3 py-2 text-sm bg-surface-100 border border-surface-200 rounded-lg text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
                />
                <button
                  type="button"
                  onClick={handleInlineFolderCreate}
                  className="px-3 py-2 text-sm font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-lg hover:bg-brand-500/30 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreatingFolder(false); setNewFolderName(""); setFolderCreateError(""); }}
                  className="px-3 py-2 text-sm text-text-muted hover:text-foreground hover:bg-surface-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            {folderCreateError && (
              <p className="text-xs text-red-400 mt-1">{folderCreateError}</p>
            )}
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
                ? isUploadingMedia
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
