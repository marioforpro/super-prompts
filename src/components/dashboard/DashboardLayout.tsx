"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { CreatePromptProvider } from "@/contexts/CreatePromptContext";
import type { User } from "@supabase/supabase-js";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("all-prompts");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleCreatePrompt = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <CreatePromptProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Topbar */}
          <Topbar
            onMenuToggle={toggleSidebar}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onCreatePrompt={handleCreatePrompt}
          />

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </CreatePromptProvider>
  );
}
