"use client";

import { useEffect, useRef } from "react";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { CreatePromptProvider, useCreatePromptModal } from "@/contexts/CreatePromptContext";
import { useDashboard } from "@/contexts/DashboardContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import type { AiModel, Folder, Tag } from "@/lib/types";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
  models: AiModel[];
  folders: Folder[];
  tags: Tag[];
}

export default function DashboardShell({
  children,
  userEmail,
  models,
  folders,
  tags,
}: DashboardShellProps) {
  return (
    <DashboardProvider
      userEmail={userEmail}
      models={models}
      folders={folders}
      tags={tags}
    >
      <CreatePromptProvider>
        <DashboardInner>{children}</DashboardInner>
      </CreatePromptProvider>
    </DashboardProvider>
  );
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useDashboard();
  const { openCreateModal } = useCreatePromptModal();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K → Open command palette
      if (isMod && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-command-palette"));
        return;
      }

      // Esc → Blur search
      if (e.key === "Escape" && target === searchInputRef.current) {
        searchInputRef.current?.blur();
        return;
      }

      // Only fire letter shortcuts when not typing in an input
      if (isInput) return;

      // N → New Prompt
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openCreateModal();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openCreateModal]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onMenuToggle={toggleSidebar} searchInputRef={searchInputRef} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
