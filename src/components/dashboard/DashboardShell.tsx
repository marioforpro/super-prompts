"use client";

import { DashboardProvider } from "@/contexts/DashboardContext";
import { CreatePromptProvider } from "@/contexts/CreatePromptContext";
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onMenuToggle={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
