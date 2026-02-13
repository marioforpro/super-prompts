"use client";

import { useState } from "react";
import Link from "next/link";
import type { AiModel, ContentType, Folder } from "@/lib/types";
import { createModel, updateModel, deleteModel } from "@/lib/actions/models";
import {
  createFolder,
  updateFolder as updateFolderAction,
  deleteFolder as deleteFolderAction,
} from "@/lib/actions/folders";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

export default function SettingsClient({ models: initialModels, folders: initialFolders }: SettingsClientProps) {
  const [models, setModels] = useState<AiModel[]>(initialModels);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(COLOR_PALETTE[0]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [folderColorPickerId, setFolderColorPickerId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelContentType, setNewModelContentType] = useState<ContentType>("TEXT");
  const [newModelColor, setNewModelColor] = useState(COLOR_PALETTE[0]);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingModelName, setEditingModelName] = useState("");
  const [modelColorPickerId, setModelColorPickerId] = useState<string | null>(null);
  const [contentTypeDropdownId, setContentTypeDropdownId] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);

  const getContentTypeBadgeColor = (contentType: ContentType | null) => {
    switch (contentType) {
      case "IMAGE":
        return "bg-yellow-500/15 text-yellow-400";
      case "VIDEO":
        return "bg-blue-500/15 text-blue-400";
      case "AUDIO":
        return "bg-purple-500/15 text-purple-400";
      case "TEXT":
        return "bg-emerald-500/15 text-emerald-400";
      default:
        return "bg-surface-200 text-text-muted";
    }
  };

  const sortedFolders = [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      setError("Folder name is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const created = await createFolder(newFolderName, newFolderColor);
      setFolders((prev) => [...prev, created]);
      setNewFolderName("");
      setNewFolderColor(COLOR_PALETTE[0]);
      setIsAddingFolder(false);
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
      setFolders((prev) => prev.map((folder) => (folder.id === id ? updated : folder)));
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
      setFolders((prev) => prev.map((folder) => (folder.id === id ? updated : folder)));
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
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
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
      const newModel = await createModel(newModelName, toSlug(newModelName), "custom", newModelContentType);
      const withColor = await updateModel(newModel.id, { icon_url: newModelColor });
      setModels((prev) => [...prev, withColor].sort((a, b) => a.name.localeCompare(b.name)));
      setNewModelName("");
      setNewModelContentType("TEXT");
      setNewModelColor(COLOR_PALETTE[0]);
      setIsAddingModel(false);
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
      setModels((prev) => prev.map((model) => (model.id === id ? updated : model)));
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
      setModels((prev) => prev.map((model) => (model.id === id ? updated : model)));
      setModelColorPickerId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update model color");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelContentTypeChange = async (id: string, contentType: ContentType) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateModel(id, { content_type: contentType });
      setModels((prev) => prev.map((model) => (model.id === id ? updated : model)));
      setContentTypeDropdownId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update content type");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteModel(id);
      setModels((prev) => prev.filter((model) => model.id !== id));
      setDeletingModelId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete model");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface hover:bg-surface-100 transition-colors duration-200 text-text-muted hover:text-foreground"
          title="Back to Dashboard"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">Settings</h1>
          <p className="text-text-muted text-sm mt-1">Manage folders and AI models</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground font-mono">Folders</h2>
          {!isAddingFolder && (
            <button
              onClick={() => setIsAddingFolder(true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors duration-200 text-white cursor-pointer"
              disabled={isLoading}
              title="Add new folder"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          )}
        </div>

        {isAddingFolder && (
          <div className="p-4 rounded-xl border border-surface-200 bg-surface-100/50 space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => {
                setNewFolderName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFolder();
              }}
              disabled={isLoading}
              autoFocus
            />
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((palColor) => (
                  <button
                    key={palColor}
                    type="button"
                    onClick={() => setNewFolderColor(palColor)}
                    disabled={isLoading}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-200 ${
                      newFolderColor === palColor ? "ring-2 ring-white scale-110" : "ring-2 ring-transparent hover:ring-surface-300"
                    }`}
                    style={{ backgroundColor: palColor }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" onClick={handleAddFolder} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Folder"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingFolder(false);
                  setNewFolderName("");
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {sortedFolders.length === 0 ? (
          <div className="flex items-center justify-center min-h-40 rounded-xl border border-surface-200 bg-surface/50">
            <p className="text-text-muted text-sm">No folders yet.</p>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-surface-200 overflow-hidden">
            {sortedFolders.map((folder) => (
              <div
                key={folder.id}
                className="px-4 py-3 flex items-center gap-3 border-b border-surface-200 last:border-b-0 bg-surface hover:bg-surface-100/50 transition-colors duration-150 group relative"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-surface-300 transition-all duration-200"
                  style={{ backgroundColor: folder.color || COLOR_PALETTE[0] }}
                  onClick={() => setFolderColorPickerId(folderColorPickerId === folder.id ? null : folder.id)}
                  title="Click to change color"
                />

                {folderColorPickerId === folder.id && (
                  <div className="absolute z-10 ml-12 p-3 rounded-lg bg-surface border border-surface-300 shadow-lg grid grid-cols-5 gap-2 w-fit">
                    {COLOR_PALETTE.map((palColor) => (
                      <button
                        key={palColor}
                        onClick={() => handleFolderColorChange(folder.id, palColor)}
                        disabled={isLoading}
                        className="w-6 h-6 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-surface-300 transition-all duration-200"
                        style={{ backgroundColor: palColor }}
                      />
                    ))}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {editingFolderId === folder.id ? (
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={() => handleRenameFolder(folder.id, editingFolderName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameFolder(folder.id, editingFolderName);
                      }}
                      disabled={isLoading}
                      className="w-full bg-surface-100 border border-brand-500/50 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingFolderId(folder.id);
                        setEditingFolderName(folder.name);
                      }}
                      disabled={isLoading}
                      className="text-foreground hover:text-brand-400 transition-colors duration-200 cursor-pointer font-medium truncate"
                    >
                      {folder.name}
                    </button>
                  )}
                </div>

                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {deletingFolderId === folder.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Sure?</span>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors duration-200 cursor-pointer text-sm font-medium"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingFolderId(null)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-200 hover:bg-surface-300 text-text-muted hover:text-foreground transition-colors duration-200 cursor-pointer text-sm font-medium"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingFolderId(folder.id)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-200 hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors duration-200 cursor-pointer"
                      title="Delete folder"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground font-mono">AI Models</h2>
          {!isAddingModel && (
            <button
              onClick={() => setIsAddingModel(true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors duration-200 text-white cursor-pointer"
              disabled={isLoading}
              title="Add new model"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          )}
        </div>

        {isAddingModel && (
          <div className="p-4 rounded-xl border border-surface-200 bg-surface-100/50 space-y-4">
            <div className="space-y-3">
              <Input
                placeholder="Model name (e.g., GPT-4, Claude, Midjourney)"
                value={newModelName}
                onChange={(e) => {
                  setNewModelName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddModel();
                }}
                disabled={isLoading}
                autoFocus
              />
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((palColor) => (
                    <button
                      key={palColor}
                      type="button"
                      onClick={() => setNewModelColor(palColor)}
                      disabled={isLoading}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-200 ${
                        newModelColor === palColor ? "ring-2 ring-white scale-110" : "ring-2 ring-transparent hover:ring-surface-300"
                      }`}
                      style={{ backgroundColor: palColor }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">Content Type</label>
                <select
                  value={newModelContentType}
                  onChange={(e) => setNewModelContentType(e.target.value as ContentType)}
                  disabled={isLoading}
                  className="w-full bg-surface-100 border border-surface-300 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200"
                >
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="AUDIO">AUDIO</option>
                  <option value="TEXT">TEXT</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" onClick={handleAddModel} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Model"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingModel(false);
                  setNewModelName("");
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {sortedModels.length === 0 ? (
          <div className="flex items-center justify-center min-h-40 rounded-xl border border-surface-200 bg-surface/50">
            <p className="text-text-muted text-sm">No models yet.</p>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-surface-200 overflow-hidden">
            {sortedModels.map((model) => {
              const color = model.icon_url || getModelColor(model.name);
              const contentType = (model.content_type || "TEXT") as ContentType;
              return (
                <div
                  key={model.id}
                  className="px-4 py-3 flex items-center gap-3 border-b border-surface-200 last:border-b-0 bg-surface hover:bg-surface-100/50 transition-colors duration-150 group relative"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-surface-300 transition-all duration-200"
                    style={{ backgroundColor: color }}
                    onClick={() => setModelColorPickerId(modelColorPickerId === model.id ? null : model.id)}
                    title="Click to change color"
                  />

                  {modelColorPickerId === model.id && (
                    <div className="absolute z-10 ml-12 p-3 rounded-lg bg-surface border border-surface-300 shadow-lg grid grid-cols-5 gap-2 w-fit">
                      {COLOR_PALETTE.map((palColor) => (
                        <button
                          key={palColor}
                          onClick={() => handleModelColorChange(model.id, palColor)}
                          disabled={isLoading}
                          className="w-6 h-6 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-surface-300 transition-all duration-200"
                          style={{ backgroundColor: palColor }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {editingModelId === model.id ? (
                      <input
                        type="text"
                        value={editingModelName}
                        onChange={(e) => setEditingModelName(e.target.value)}
                        onBlur={() => handleRenameModel(model.id, editingModelName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameModel(model.id, editingModelName);
                        }}
                        disabled={isLoading}
                        className="w-full bg-surface-100 border border-brand-500/50 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingModelId(model.id);
                          setEditingModelName(model.name);
                        }}
                        disabled={isLoading}
                        className="text-foreground hover:text-brand-400 transition-colors duration-200 cursor-pointer font-medium truncate"
                      >
                        {model.name}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <div
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 ${getContentTypeBadgeColor(contentType)}`}
                      onClick={() => setContentTypeDropdownId(contentTypeDropdownId === model.id ? null : model.id)}
                    >
                      {contentType}
                    </div>

                    {contentTypeDropdownId === model.id && (
                      <div className="absolute right-0 z-10 mt-1 bg-surface border border-surface-300 rounded-lg shadow-lg overflow-hidden">
                        {(["IMAGE", "VIDEO", "AUDIO", "TEXT"] as ContentType[]).map((ct) => (
                          <button
                            key={ct}
                            onClick={() => handleModelContentTypeChange(model.id, ct)}
                            disabled={isLoading}
                            className={`w-full px-4 py-2 text-sm text-left transition-colors duration-200 ${
                              ct === contentType
                                ? "bg-brand-500/20 text-brand-300 font-medium"
                                : "text-text-muted hover:bg-surface-100 hover:text-foreground"
                            }`}
                          >
                            {ct}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {deletingModelId === model.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Sure?</span>
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors duration-200 cursor-pointer text-sm font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingModelId(null)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-200 hover:bg-surface-300 text-text-muted hover:text-foreground transition-colors duration-200 cursor-pointer text-sm font-medium"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingModelId(model.id)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-200 hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors duration-200 cursor-pointer"
                        title="Delete model"
                      >
                        <span className="text-lg leading-none">×</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
