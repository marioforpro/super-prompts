"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, User, MoonStar, Download, Sparkles, LogOut } from "lucide-react";
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
  const userMenuHoverTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (userMenuHoverTimeoutRef.current) {
        window.clearTimeout(userMenuHoverTimeoutRef.current);
      }
    };
  }, []);

  const clearUserMenuHoverTimeout = () => {
    if (userMenuHoverTimeoutRef.current) {
      window.clearTimeout(userMenuHoverTimeoutRef.current);
      userMenuHoverTimeoutRef.current = null;
    }
  };

  const handleUserMenuMouseEnter = () => {
    clearUserMenuHoverTimeout();
    setUserMenuOpen(true);
  };

  const handleUserMenuMouseLeave = () => {
    clearUserMenuHoverTimeout();
    userMenuHoverTimeoutRef.current = window.setTimeout(() => {
      setUserMenuOpen(false);
    }, 140);
  };

  return (
    <div className="sticky top-0 z-40 w-full h-[57px] bg-surface border-b border-surface-200">
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
            className="new-prompt-cta group relative overflow-hidden hidden sm:inline-flex items-center gap-2 h-[34px] px-3.5 rounded-lg border border-brand-500/45 bg-[linear-gradient(135deg,rgba(10,12,20,0.96),rgba(18,20,34,0.96))] text-brand-300 shadow-[0_0_0_1px_rgba(232,118,75,0.18),0_10px_24px_rgba(0,0,0,0.34)] hover:text-brand-300 hover:border-brand-500/70 hover:shadow-[0_0_0_1px_rgba(232,118,75,0.35),0_12px_28px_rgba(232,118,75,0.18)] hover:-translate-y-px active:translate-y-0 active:scale-[0.99] transition-all duration-250 cursor-default"
          >
            <span className="pointer-events-none absolute inset-y-0 -left-10 w-8 bg-brand-300/14 blur-[1px] translate-x-0 group-hover:translate-x-[220px] transition-transform duration-700" />
            <svg className="relative z-[1] w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(232,118,75,0.45)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M12 5v14M5 12h14" />
            </svg>
            <span className="relative z-[1] text-xs font-semibold tracking-[0.06em] uppercase group-hover:drop-shadow-[0_0_6px_rgba(232,118,75,0.35)]">New Prompt</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="relative"
            ref={userMenuRef}
            onMouseEnter={handleUserMenuMouseEnter}
            onMouseLeave={handleUserMenuMouseLeave}
          >
            <button
              onClick={() => {
                clearUserMenuHoverTimeout();
                setUserMenuOpen(!userMenuOpen);
              }}
              className="h-[36px] w-[36px] rounded-lg border border-surface-200 bg-surface-100 text-text-muted hover:text-foreground hover:border-surface-300 hover:bg-surface transition-colors inline-flex items-center justify-center"
              title="Account and settings"
              aria-expanded={userMenuOpen}
            >
              <User className="w-4 h-4" />
            </button>

            {userMenuOpen && (
              <div className="account-menu-panel absolute right-0 mt-2 w-[280px] rounded-2xl border border-surface-200/90 bg-[linear-gradient(180deg,rgba(22,24,37,0.96)_0%,rgba(18,20,32,0.97)_100%)] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] overflow-hidden">
                <div className="px-4 py-3.5 border-b border-surface-200/70">
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-[0_6px_16px_rgba(232,118,75,0.35)]">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                      <p className="text-xs text-text-dim mt-0.5">Free plan</p>
                    </div>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-text-muted hover:bg-white/[0.06] hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <MoonStar className="w-4 h-4 opacity-90" />
                      <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                    </span>
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
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-text-muted hover:bg-white/[0.06] hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 opacity-90" />
                    <span>Export prompts</span>
                  </button>

                  <button
                    onClick={handleShowWelcomeGuide}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-text-muted hover:bg-white/[0.06] hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 opacity-90" />
                    <span>Show welcome guide</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      window.location.assign("/dashboard/settings");
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-text-muted hover:bg-white/[0.06] hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 opacity-90" />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="border-t border-surface-200/70 p-2">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-300/90 hover:bg-red-500/12 hover:text-red-200 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
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
