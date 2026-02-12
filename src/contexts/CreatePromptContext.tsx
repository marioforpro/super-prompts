"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface CreatePromptContextType {
  openCreateModal: () => void;
  registerOpenCallback: (callback: () => void) => void;
}

const CreatePromptContext = createContext<CreatePromptContextType | undefined>(
  undefined
);

export function CreatePromptProvider({ children }: { children: ReactNode }) {
  const [openCallback, setOpenCallback] = useState<(() => void) | null>(null);

  const registerOpenCallback = useCallback((callback: () => void) => {
    setOpenCallback(() => callback);
  }, []);

  const openCreateModal = useCallback(() => {
    openCallback?.();
  }, [openCallback]);

  return (
    <CreatePromptContext.Provider value={{ openCreateModal, registerOpenCallback }}>
      {children}
    </CreatePromptContext.Provider>
  );
}

export function useCreatePromptModal() {
  const context = useContext(CreatePromptContext);
  if (!context) {
    throw new Error(
      "useCreatePromptModal must be used within CreatePromptProvider"
    );
  }
  return context;
}
