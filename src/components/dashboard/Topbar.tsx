"use client";

import { useState, useRef, useEffect } from "react";
import { PlusIcon } from "@/components/icons/Logo";
import { Settings2 } from "lucide-react";
import { useCreatePromptModal } from "@/contexts/CreatePromptContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  onMenuToggle: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function Topbar({ onMenuToggle, searchInputRef }: TopbarProps) {
  const { openCreateModal } = useCreatePromptModal();
  const { viewMode, setViewMode, searchQuery, setSearchQuery, userEmail, userInitial } = useDashboard();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("sp-theme") as "dark" | "light" | null) || "dark";
  });
  const [toast, setToast] = useState<{ message: string; type: "info" | "error" } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sp-theme", next);
  };

  const handleShowWelcomeGuide = () => {
    setUserMenuOpen(false);
    localStorage.removeItem("sp-welcome-dismissed");
    window.dispatchEvent(new CustomEvent("show-welcome-guide"));
  };

  const handleExportPrompts = async () => {
    setUserMenuOpen(false);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prompts } = await supabase
        .from("prompts")
        .select("title, content, notes, source_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!prompts || prompts.length === 0) {
        showToast("No prompts to export", "info");
        return;
      }
      const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `superprompts-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Export failed. Please try again.", "error");
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full h-[57px] bg-surface/80 backdrop-blur-md border-b border-surface-200">
      <div className="px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className="h-[36px] w-[36px] flex items-center justify-center hover:bg-surface-100 rounded-lg transition-colors md:hidden flex-shrink-0 cursor-pointer"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 max-w-[460px]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[30px] pl-9 pr-3 bg-surface-100 border border-surface-200 rounded-lg text-sm text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-surface-100 rounded-lg h-[34px] px-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 h-[26px] rounded transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-surface-300 text-foreground" : "text-text-muted hover:text-foreground"
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 h-[26px] rounded transition-all cursor-pointer ${
                viewMode === "list" ? "bg-surface-300 text-foreground" : "text-text-muted hover:text-foreground"
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="hidden sm:inline-flex items-center gap-2 h-[34px] px-3 rounded-lg border border-brand-500/55 bg-gradient-to-r from-brand-500/22 to-brand-400/22 text-brand-200 hover:text-white hover:border-brand-400/70 hover:shadow-[0_0_20px_rgba(232,118,75,0.22)] transition-all"
          >
            <PlusIcon size={14} />
            <span className="text-xs font-semibold tracking-[0.08em] uppercase">New Prompt</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => openCreateModal()}
            className="sm:hidden h-[36px] w-[36px] flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-500 text-white rounded-lg shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <PlusIcon size={16} />
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-[36px] w-[36px] rounded-lg border border-surface-200 bg-surface-100 text-text-muted hover:text-foreground hover:border-surface-300 transition-colors inline-flex items-center justify-center"
              title="Account and settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-100 border border-surface-200 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                      <p className="text-xs text-text-dim">Free plan</p>
                    </div>
                  </div>
                </div>

                <div className="py-1.5">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                    <div
                      className="relative w-8 h-[18px] rounded-full transition-colors duration-200"
                      style={{ backgroundColor: theme === "dark" ? "var(--brand-400)" : "var(--surface-300)" }}
                    >
                      <div
                        className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200"
                        style={{ transform: theme === "dark" ? "translateX(14px)" : "translateX(2px)" }}
                      />
                    </div>
                  </button>

                  <button
                    onClick={handleExportPrompts}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Export prompts</span>
                  </button>

                  <button
                    onClick={handleShowWelcomeGuide}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Show welcome guide</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      window.location.assign("/dashboard/settings");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Settings</span>
                  </button>
                </div>

                <div className="border-t border-surface-200 py-1.5">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <span>Sign out</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === "error"
              ? "bg-red-500/20 border border-red-500/30 text-red-300"
              : "bg-brand-500/20 border border-brand-500/30 text-brand-300"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
