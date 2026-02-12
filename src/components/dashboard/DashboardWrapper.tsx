"use client";

import { useState, useCallback, useEffect } from "react";
import { DashboardContent } from "./DashboardContent";
import type { Prompt, AiModel, Folder, Tag } from "@/lib/types";

interface DashboardWrapperProps {
  initialPrompts: Prompt[];
  models: AiModel[];
  folders: Folder[];
  tags: Tag[];
  viewMode: "grid" | "list";
  onModalOpen?: (callback: () => void) => void;
}

export function DashboardWrapper({
  initialPrompts,
  models,
  folders,
  tags,
  viewMode,
  onModalOpen,
}: DashboardWrapperProps) {
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  const handleModalOpen = useCallback((callback: () => void) => {
    setModalCallback(() => callback);
  }, []);

  // Expose modal open function to parent
  useEffect(() => {
    onModalOpen?.(modalCallback || (() => {}));
  }, [modalCallback, onModalOpen]);

  return (
    <DashboardContent
      initialPrompts={initialPrompts}
      models={models}
      folders={folders}
      tags={tags}
      viewMode={viewMode}
      onModalOpen={handleModalOpen}
    />
  );
}
