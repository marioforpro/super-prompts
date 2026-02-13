"use client";

import { useState } from "react";
import Link from "next/link";
import { AiModel, ContentType } from "@/lib/types";
import {
  createModel,
  updateModel,
  deleteModel,
} from "@/lib/actions/models";
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

interface SettingsClientProps {
  models: AiModel[];
}

export default function SettingsClient({ models: initialModels }: SettingsClientProps) {
  const [models, setModels] = useState<AiModel[]>(initialModels);
  const [isAdding, setIsAdding] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelContentType, setNewModelContentType] = useState<ContentType>("TEXT");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [contentTypeDropdownId, setContentTypeDropdownId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newModelColor, setNewModelColor] = useState(COLOR_PALETTE[0]);

  const handleAddModel = async () => {
    if (!newModelName.trim()) {
      setError("Model name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const slug = newModelName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const newModel = await createModel(newModelName, slug, "custom", newModelContentType);

      // Set the chosen color
      await updateModel(newModel.id, { icon_url: newModelColor });
      newModel.icon_url = newModelColor;

      setModels([...models, newModel].sort((a, b) => a.name.localeCompare(b.name)));
      setNewModelName("");
      setNewModelContentType("TEXT");
      setNewModelColor(COLOR_PALETTE[0]);
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create model");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = async (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingId(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const slug = newName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const updated = await updateModel(id, { name: newName, slug });
      setModels(
        models.map((m) => (m.id === id ? updated : m)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename model");
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = async (id: string, color: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await updateModel(id, { icon_url: color });
      setModels(models.map((m) => (m.id === id ? updated : m)));
      setColorPickerId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update model color");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentTypeChange = async (id: string, contentType: ContentType) => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await updateModel(id, { content_type: contentType });
      setModels(models.map((m) => (m.id === id ? updated : m)));
      setContentTypeDropdownId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update content type");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteModel(id);
      setModels(models.filter((m) => m.id !== id));
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete model");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface hover:bg-surface-100 transition-colors duration-200 text-text-muted hover:text-foreground"
          title="Back to Dashboard"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
            Settings
          </h1>
          <p className="text-text-muted text-sm mt-1">Manage your AI models and preferences</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* AI Models Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground font-mono">AI Models</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors duration-200 text-white cursor-pointer"
              disabled={isLoading}
              title="Add new model"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          )}
        </div>

        {/* Add New Model Form */}
        {isAdding && (
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
                  if (e.key === "Enter") {
                    handleAddModel();
                  }
                }}
                disabled={isLoading}
                autoFocus
              />
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((palColor) => (
                    <button
                      key={palColor}
                      type="button"
                      onClick={() => setNewModelColor(palColor)}
                      disabled={isLoading}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-200 ${
                        newModelColor === palColor ? 'ring-2 ring-white scale-110' : 'ring-2 ring-transparent hover:ring-surface-300'
                      }`}
                      style={{ backgroundColor: palColor }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">
                  Content Type
                </label>
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
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddModel}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Model"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
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

        {/* Models List */}
        {models.length === 0 ? (
          <div className="flex items-center justify-center min-h-64 rounded-xl border border-surface-200 bg-surface/50">
            <div className="text-center max-w-sm">
              <h3 className="text-lg font-semibold text-foreground mb-2">No models yet</h3>
              <p className="text-text-muted text-sm">
                Create your first AI model to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-surface-200 overflow-hidden">
            {models.map((model) => {
              const color = model.icon_url || getModelColor(model.name);
              const contentType = (model.content_type || "TEXT") as ContentType;

              return (
                <div
                  key={model.id}
                  className="px-4 py-3 flex items-center gap-3 border-b border-surface-200 last:border-b-0 bg-surface hover:bg-surface-100/50 transition-colors duration-150 group"
                >
                  {/* Color Dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-surface-300 transition-all duration-200 relative"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setColorPickerId(colorPickerId === model.id ? null : model.id)
                    }
                    title="Click to change color"
                  />

                  {/* Color Picker Popup */}
                  {colorPickerId === model.id && (
                    <div className="absolute z-10 ml-12 p-3 rounded-lg bg-surface border border-surface-300 shadow-lg grid grid-cols-5 gap-2 w-fit">
                      {COLOR_PALETTE.map((palColor) => (
                        <button
                          key={palColor}
                          onClick={() => handleColorChange(model.id, palColor)}
                          disabled={isLoading}
                          className="w-6 h-6 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-surface-300 transition-all duration-200"
                          style={{ backgroundColor: palColor }}
                          title={palColor}
                        />
                      ))}
                    </div>
                  )}

                  {/* Model Name */}
                  <div className="flex-1 min-w-0">
                    {editingId === model.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRename(model.id, editingName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRename(model.id, editingName);
                          }
                        }}
                        disabled={isLoading}
                        className="w-full bg-surface-100 border border-brand-500/50 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(model.id);
                          setEditingName(model.name);
                        }}
                        disabled={isLoading}
                        className="text-foreground hover:text-brand-400 transition-colors duration-200 cursor-pointer font-medium truncate"
                      >
                        {model.name}
                      </button>
                    )}
                  </div>

                  {/* Content Type Badge */}
                  <div className="relative group/dropdown">
                    <div
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 ${getContentTypeBadgeColor(
                        contentType
                      )}`}
                      onClick={() =>
                        setContentTypeDropdownId(
                          contentTypeDropdownId === model.id ? null : model.id
                        )
                      }
                    >
                      {contentType}
                    </div>

                    {/* Content Type Dropdown */}
                    {contentTypeDropdownId === model.id && (
                      <div className="absolute right-0 z-10 mt-1 bg-surface border border-surface-300 rounded-lg shadow-lg overflow-hidden">
                        {(["IMAGE", "VIDEO", "AUDIO", "TEXT"] as ContentType[]).map(
                          (ct) => (
                            <button
                              key={ct}
                              onClick={() => handleContentTypeChange(model.id, ct)}
                              disabled={isLoading}
                              className={`w-full px-4 py-2 text-sm text-left transition-colors duration-200 ${
                                ct === contentType
                                  ? "bg-brand-500/20 text-brand-300 font-medium"
                                  : "text-text-muted hover:bg-surface-100 hover:text-foreground"
                              }`}
                            >
                              {ct}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {deletingId === model.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Sure?</span>
                        <button
                          onClick={() => handleDelete(model.id)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors duration-200 cursor-pointer text-sm font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-200 hover:bg-surface-300 text-text-muted hover:text-foreground transition-colors duration-200 cursor-pointer text-sm font-medium"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(model.id)}
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
