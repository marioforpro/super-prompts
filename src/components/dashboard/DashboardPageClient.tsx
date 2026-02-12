"use client";

import { useCallback } from "react";
import { useCreatePromptModal } from "@/contexts/CreatePromptContext";
import { DashboardContent } from "./DashboardContent";
import type { Prompt, AiModel, Folder, Tag } from "@/lib/types";

interface DashboardPageClientProps {
  initialPrompts: Prompt[];
  models: AiModel[];
  folders: Folder[];
  tags: Tag[];
}

export function DashboardPageClient({
  initialPrompts,
  models,
  folders,
  tags,
}: DashboardPageClientProps) {
  const { registerOpenCallback } = useCreatePromptModal();

  // When content registers its open callback, pass it to context
  const handleModalOpen = useCallback((callback: () => void) => {
    registerOpenCallback(callback);
  }, [registerOpenCallback]);

  return (
    <DashboardContent
      initialPrompts={initialPrompts}
      models={models}
      folders={folders}
      tags={tags}
      onModalOpen={handleModalOpen}
    />
  );
}
