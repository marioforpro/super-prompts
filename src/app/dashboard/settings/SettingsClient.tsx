"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AiModel, Folder } from "@/lib/types";
import { useDashboard } from "@/contexts/DashboardContext";
import { createModel, updateModel, deleteModel } from "@/lib/actions/models";
import {
  createFolder,
  updateFolder as updateFolderAction,
  deleteFolder as deleteFolderAction,
} from "@/lib/actions/folders";
import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon";

const COLOR_PALETTE = [
  "#e8764b",
  "#f87171",
  "#fb923c",
  "#facc15",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#2dd4bf",
  "#22d3ee",
  "#38bdf8",
  "#60a5fa",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#d4a574",
  "#94a3b8",
  "#f0eff2",
];

function getModelColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

interface SettingsClientProps {
  models: AiModel[];
  folders: Folder[];
}

export default function SettingsClient({ models: _initialModels, folders: _initialFolders }: SettingsClientProps) {
  const {
    folders,
    models,
    promptIndex,
    addFolder,
    removeFolder,
    updateFolder,
    addModel,
    removeModel,
    updateModelCtx,
  } = useDashboard();

  const effectiveFolders = folders.length > 0 ? folders : _initialFolders;
  const effectiveModels = models.length > 0 ? models : _initialModels;

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(COLOR_PALETTE[0]);
  const [newModelName, setNewModelName] = useState("");
  const [newModelColor, setNewModelColor] = useState(COLOR_PALETTE[0]);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingModelName, setEditingModelName] = useState("");
  const [folderColorPickerId, setFolderColorPickerId] = useState<string | null>(null);
  const [modelColorPickerId, setModelColorPickerId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);

  const [dragFolderId, setDragFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragModelSlug, setDragModelSlug] = useState<string | null>(null);
  const [dragOverModelSlug, setDragOverModelSlug] = useState<string | null>(null);
  const [modelOrder, setModelOrder] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("superprompts:model-order");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setModelOrder(parsed.filter((item) => typeof item === "string"));
      }
    } catch {
      // Ignore invalid localStorage data.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("superprompts:model-order", JSON.stringify(modelOrder));
  }, [modelOrder]);

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

  const sortedFolders = useMemo(
    () => [...effectiveFolders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [effectiveFolders]
  );

  const sortedModels = useMemo(() => {
    const byName = [...effectiveModels].sort((a, b) => a.name.localeCompare(b.name));
    if (modelOrder.length === 0) return byName;
    const bySlug = new Map(byName.map((m) => [m.slug, m]));
    const ordered: AiModel[] = [];
    for (const slug of modelOrder) {
      const found = bySlug.get(slug);
      if (!found) continue;
      ordered.push(found);
      bySlug.delete(slug);
    }
    ordered.push(...Array.from(bySlug.values()));
    return ordered;
  }, [effectiveModels, modelOrder]);

  const folderPromptTotal = useMemo(
    () => Object.values(folderPromptCounts).reduce((acc, value) => acc + value, 0),
    [folderPromptCounts]
  );
  const modelPromptTotal = useMemo(
    () => Object.values(modelPromptCounts).reduce((acc, value) => acc + value, 0),
    [modelPromptCounts]
  );

  const saveFolderOrder = (ordered: Folder[]) => {
    ordered.forEach((folder, index) => {
      updateFolder(folder.id, { sort_order: index });
      updateFolderAction(folder.id, { sort_order: index }).catch(() => {});
    });
  };

  const handleDropFolder = (targetId: string) => {
    if (!dragFolderId || dragFolderId === targetId) return;
    const ordered = [...sortedFolders];
    const from = ordered.findIndex((f) => f.id === dragFolderId);
    const to = ordered.findIndex((f) => f.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    saveFolderOrder(ordered);
    setDragOverFolderId(null);
  };

  const handleDropModel = (targetSlug: string) => {
    if (!dragModelSlug || dragModelSlug === targetSlug) return;
    const slugs = sortedModels.map((m) => m.slug);
    const from = slugs.findIndex((slug) => slug === dragModelSlug);
    const to = slugs.findIndex((slug) => slug === targetSlug);
    if (from === -1 || to === -1) return;
    const [moved] = slugs.splice(from, 1);
    slugs.splice(to, 0, moved);
    setModelOrder(slugs);
    setDragOverModelSlug(null);
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      setError("Folder name is required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const created = await createFolder(newFolderName, newFolderColor);
      addFolder(created);
      setNewFolderName("");
      setNewFolderColor(COLOR_PALETTE[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    if (!name.trim()) {
      setEditingFolderId(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateFolderAction(id, { name });
      updateFolder(id, updated);
      setEditingFolderId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderColorChange = async (id: string, color: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateFolderAction(id, { color });
      updateFolder(id, updated);
      setFolderColorPickerId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update folder color");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteFolderAction(id);
      removeFolder(id);
      setDeletingFolderId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModel = async () => {
    if (!newModelName.trim()) {
      setError("Model name is required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const created = await createModel(newModelName, toSlug(newModelName), "custom", null);
      const withColor = await updateModel(created.id, { icon_url: newModelColor });
      addModel(withColor);
      setNewModelName("");
      setNewModelColor(COLOR_PALETTE[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create model");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameModel = async (id: string, name: string) => {
    if (!name.trim()) {
      setEditingModelId(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateModel(id, { name, slug: toSlug(name) });
      updateModelCtx(id, updated);
      setEditingModelId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename model");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelColorChange = async (id: string, color: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateModel(id, { icon_url: color });
      updateModelCtx(id, updated);
      setModelColorPickerId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update model color");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async (id: string, slug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteModel(id);
      removeModel(id);
      setModelOrder((prev) => prev.filter((item) => item !== slug));
      setDeletingModelId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete model");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="w-full space-y-6">
        <div className="rounded-2xl border border-surface-200 bg-surface-100/55 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface hover:bg-surface-100 text-text-muted hover:text-foreground transition-colors"
              title="Back to Dashboard"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
              <p className="text-sm text-text-dim">Organize folders and AI models in one place.</p>
            </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface hover:bg-surface-100 text-text-muted hover:text-foreground transition-colors"
              title="Close settings"
            >
              <span className="text-lg leading-none">×</span>
            </Link>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-2xl border border-surface-200 bg-surface-100/45 backdrop-blur-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-[0.18em] text-text-dim">Folders</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-surface-200 text-text-muted">{folderPromptTotal} prompts</span>
            </div>

            <div className="grid grid-cols-[1fr_120px_auto] gap-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="h-10 rounded-lg border border-surface-200 bg-surface px-3 text-sm text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400"
              />
              <select
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
                className="h-10 rounded-lg border border-surface-200 bg-surface px-2 text-xs text-text-muted"
              >
                {COLOR_PALETTE.map((color, idx) => (
                  <option key={color} value={color}>{`Color ${idx + 1}`}</option>
                ))}
              </select>
              <button
                onClick={handleAddFolder}
                disabled={isLoading}
                className="h-10 px-3 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {sortedFolders.map((folder) => (
                <div
                  key={folder.id}
                  draggable
                  onDragStart={() => setDragFolderId(folder.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragFolderId) setDragOverFolderId(folder.id);
                  }}
                  onDragEnter={() => {
                    if (dragFolderId) setDragOverFolderId(folder.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                  }}
                  onDrop={() => handleDropFolder(folder.id)}
                  onDragEnd={() => {
                    setDragFolderId(null);
                    setDragOverFolderId(null);
                  }}
                  className="relative rounded-xl border border-surface-200 bg-surface px-3 py-2.5 flex items-center gap-2"
                >
                  {dragFolderId && dragOverFolderId === folder.id && dragFolderId !== folder.id && (
                    <div className="absolute left-2 right-2 top-0 h-0.5 bg-brand-400 rounded-full" />
                  )}
                  <span className="text-text-dim text-xs">⋮⋮</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: folder.color || COLOR_PALETTE[0] }} />
                  <div className="flex-1 min-w-0">
                    {editingFolderId === folder.id ? (
                      <input
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onBlur={() => handleRenameFolder(folder.id, editingFolderName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFolder(folder.id, editingFolderName);
                        }}
                        className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                        className="text-sm text-foreground truncate"
                      >
                        {folder.name}
                      </button>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 text-text-muted">
                    {folderPromptCounts[folder.id] || 0}
                  </span>
                  <button
                    onClick={() => setFolderColorPickerId(folderColorPickerId === folder.id ? null : folder.id)}
                    className="w-6 h-6 rounded-md border border-surface-200"
                    style={{ backgroundColor: folder.color || COLOR_PALETTE[0] }}
                  />
                  <button
                    onClick={() => setDeletingFolderId(deletingFolderId === folder.id ? null : folder.id)}
                    className="w-8 h-8 rounded-md text-red-300 hover:bg-red-500/15 text-base"
                  >
                    ×
                  </button>

                  {folderColorPickerId === folder.id && (
                    <div className="absolute right-8 top-11 z-20 rounded-lg border border-surface-200 bg-surface p-2 grid grid-cols-5 gap-1">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleFolderColorChange(folder.id, color)}
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  {deletingFolderId === folder.id && (
                    <div className="absolute inset-0 rounded-xl bg-black/55 backdrop-blur-sm flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="px-2.5 py-1 rounded-md bg-red-500/25 text-red-200 text-xs"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingFolderId(null)}
                        className="px-2.5 py-1 rounded-md bg-surface-200 text-text-muted text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-surface-200 bg-surface-100/45 backdrop-blur-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-[0.18em] text-text-dim">AI Models</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-surface-200 text-text-muted">{modelPromptTotal} prompts</span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_120px_auto] gap-2">
              <input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="New model name"
                className="h-10 rounded-lg border border-surface-200 bg-surface px-3 text-sm text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400"
              />
              <select
                value={newModelColor}
                onChange={(e) => setNewModelColor(e.target.value)}
                className="h-10 rounded-lg border border-surface-200 bg-surface px-2 text-xs text-text-muted"
              >
                {COLOR_PALETTE.map((color, idx) => (
                  <option key={color} value={color}>{`Color ${idx + 1}`}</option>
                ))}
              </select>
              <button
                onClick={handleAddModel}
                disabled={isLoading}
                className="h-10 px-3 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {sortedModels.map((model) => (
                <div
                  key={model.id}
                  draggable
                  onDragStart={() => setDragModelSlug(model.slug)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragModelSlug) setDragOverModelSlug(model.slug);
                  }}
                  onDragEnter={() => {
                    if (dragModelSlug) setDragOverModelSlug(model.slug);
                  }}
                  onDragLeave={() => {
                    if (dragOverModelSlug === model.slug) setDragOverModelSlug(null);
                  }}
                  onDrop={() => handleDropModel(model.slug)}
                  onDragEnd={() => {
                    setDragModelSlug(null);
                    setDragOverModelSlug(null);
                  }}
                  className="relative rounded-xl border border-surface-200 bg-surface px-3 py-2.5 flex items-center gap-2"
                >
                  {dragModelSlug && dragOverModelSlug === model.slug && dragModelSlug !== model.slug && (
                    <div className="absolute left-2 right-2 top-0 h-0.5 bg-brand-400 rounded-full" />
                  )}
                  <span className="text-text-dim text-xs">⋮⋮</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.icon_url || getModelColor(model.name) }} />
                  <div className="flex-1 min-w-0">
                    {editingModelId === model.id ? (
                      <input
                        value={editingModelName}
                        onChange={(e) => setEditingModelName(e.target.value)}
                        onBlur={() => handleRenameModel(model.id, editingModelName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameModel(model.id, editingModelName);
                        }}
                        className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingModelId(model.id);
                          setEditingModelName(model.name);
                        }}
                        className="text-sm text-foreground truncate"
                      >
                        {model.name}
                      </button>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 text-text-muted">
                    {modelPromptCounts[model.slug] || 0}
                  </span>
                  <button
                    onClick={() => setModelColorPickerId(modelColorPickerId === model.id ? null : model.id)}
                    className="w-6 h-6 rounded-md border border-surface-200"
                    style={{ backgroundColor: model.icon_url || getModelColor(model.name) }}
                  />
                  <button
                    onClick={() => setDeletingModelId(deletingModelId === model.id ? null : model.id)}
                    className="w-8 h-8 rounded-md text-red-300 hover:bg-red-500/15 text-base"
                  >
                    ×
                  </button>

                  {modelColorPickerId === model.id && (
                    <div className="absolute right-8 top-11 z-20 rounded-lg border border-surface-200 bg-surface p-2 grid grid-cols-5 gap-1">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleModelColorChange(model.id, color)}
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  {deletingModelId === model.id && (
                    <div className="absolute inset-0 rounded-xl bg-black/55 backdrop-blur-sm flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteModel(model.id, model.slug)}
                        className="px-2.5 py-1 rounded-md bg-red-500/25 text-red-200 text-xs"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingModelId(null)}
                        className="px-2.5 py-1 rounded-md bg-surface-200 text-text-muted text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
