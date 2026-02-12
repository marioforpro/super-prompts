"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { AiModel, Folder, Tag } from "@/lib/types";

interface DashboardState {
  // View
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Filters
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  selectedModelSlug: string | null;
  setSelectedModelSlug: (slug: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  // Reference data (mutable)
  folders: Folder[];
  addFolder: (folder: Folder) => void;
  removeFolder: (id: string) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  models: AiModel[];
  tags: Tag[];
  removeTag: (id: string) => void;
  // User
  userEmail: string;
  userInitial: string;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function DashboardProvider({
  children,
  folders: initialFolders,
  models,
  tags,
  userEmail,
}: {
  children: ReactNode;
  folders: Folder[];
  models: AiModel[];
  tags: Tag[];
  userEmail: string;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedModelSlug, setSelectedModelSlug] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [tagsState, setTagsState] = useState<Tag[]>(tags);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U";

  const addFolder = (folder: Folder) => {
    setFolders((prev) => [...prev, folder]);
  };

  const removeFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeTag = (id: string) => {
    setTagsState((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <DashboardContext.Provider
      value={{
        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
        selectedFolderId,
        setSelectedFolderId,
        selectedModelSlug,
        setSelectedModelSlug,
        selectedTag,
        setSelectedTag,
        showFavoritesOnly,
        setShowFavoritesOnly,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        folders,
        addFolder,
        removeFolder,
        updateFolder,
        models,
        tags: tagsState,
        removeTag,
        userEmail,
        userInitial,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
