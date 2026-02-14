"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { CreatePromptProvider } from "@/contexts/CreatePromptContext";
import { useCreatePromptModal } from "@/contexts/CreatePromptContext";
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
  initialPromptIndex?: Array<{
    id: string;
    isFavorite: boolean;
    modelSlug: string | null;
    folderIds: string[];
  }>;
}

export default function DashboardShell({
  children,
  userEmail,
  models,
  folders,
  tags,
  initialPromptIndex,
}: DashboardShellProps) {
  return (
    <DashboardProvider
      userEmail={userEmail}
      models={models}
      folders={folders}
      tags={tags}
      initialPromptIndex={initialPromptIndex}
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
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-screen bg-surface/30 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onMenuToggle={toggleSidebar} searchInputRef={searchInputRef} />
        <main className="flex-1 overflow-y-auto bg-surface/20">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
      {pathname === "/dashboard" && (
        <button
          onClick={() => openCreateModal()}
          className="floating-prompt-cta fixed right-5 bottom-5 z-[80] w-12 h-12 flex items-center justify-center rounded-xl border border-brand-500/45 bg-[linear-gradient(135deg,rgba(10,12,20,0.96),rgba(18,20,34,0.96))] text-brand-300 shadow-[0_0_0_1px_rgba(232,118,75,0.18),0_10px_24px_rgba(0,0,0,0.34)] hover:text-brand-300 hover:border-brand-500/70 transition-colors cursor-default"
          aria-label="New Prompt"
          title="New Prompt"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}
