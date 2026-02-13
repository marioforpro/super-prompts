"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons/Logo";
import { useCreatePromptModal } from "@/contexts/CreatePromptContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  onMenuToggle: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function Topbar({ onMenuToggle, searchInputRef }: TopbarProps) {
  const router = useRouter();
  const { openCreateModal } = useCreatePromptModal();
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    userEmail,
    userInitial,
  } = useDashboard();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("sp-theme") as "dark" | "light" | null) || "dark";
  });
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
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
      const { data: { user } } = await supabase.auth.getUser();
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
        {/* Left: Hamburger + Search */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className="h-[38px] w-[38px] flex items-center justify-center hover:bg-surface-100 rounded-lg transition-colors md:hidden flex-shrink-0 cursor-pointer"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 max-w-[620px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[34px] pl-9 pr-14 bg-surface-100 border border-surface-200 rounded-lg text-sm text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-200 border border-surface-300 text-[10px] text-text-dim font-mono pointer-events-none">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: View Toggle + New Prompt + User */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Grid/List Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-100 rounded-lg h-[38px] px-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 h-[30px] rounded transition-all cursor-pointer ${
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
              className={`px-3 h-[30px] rounded transition-all cursor-pointer ${
                viewMode === "list" ? "bg-surface-300 text-foreground" : "text-text-muted hover:text-foreground"
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* New Prompt Button */}
          <button
            onClick={() => openCreateModal()}
            className="hidden sm:flex items-center gap-2 px-4 h-[38px] bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 text-white rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 font-medium text-sm cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>New Prompt</span>
          </button>

          {/* Mobile New Prompt */}
          <button
            onClick={() => openCreateModal()}
            className="sm:hidden h-[38px] w-[38px] flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-500 text-white rounded-lg shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <PlusIcon size={16} />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-[38px] w-[38px] rounded-full bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all cursor-pointer"
            >
              {userInitial}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-100 border border-surface-200 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                {!showShortcuts ? (
                  <>
                    {/* User info */}
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

                    {/* Settings options */}
                    <div className="py-1.5">
                      {/* Theme toggle */}
                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {theme === "dark" ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            )}
                          </svg>
                          <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                        </div>
                        <div className="relative w-8 h-[18px] rounded-full transition-colors duration-200"
                          style={{ backgroundColor: theme === "dark" ? "var(--brand-400)" : "var(--surface-300)" }}>
                          <div className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200"
                            style={{ transform: theme === "dark" ? "translateX(14px)" : "translateX(2px)" }} />
                        </div>
                      </button>

                      {/* Export prompts */}
                      <button
                        onClick={handleExportPrompts}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export prompts</span>
                      </button>

                      {/* Keyboard shortcuts */}
                      <button
                        onClick={() => setShowShortcuts(true)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span>Keyboard shortcuts</span>
                        </div>
                        <span className="text-xs text-text-dim">⌘K</span>
                      </button>

                      {/* Show welcome guide */}
                      <button
                        onClick={handleShowWelcomeGuide}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Show welcome guide</span>
                      </button>

                      {/* Settings */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setShowShortcuts(false);
                          router.push('/dashboard/settings');
                          router.refresh();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-surface-200 py-1.5">
                      <form action={signOut}>
                        <button type="submit" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign out</span>
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Shortcuts panel header */}
                    <div className="px-4 py-3 border-b border-surface-200 flex items-center gap-3">
                      <button
                        onClick={() => setShowShortcuts(false)}
                        className="flex items-center justify-center w-6 h-6 hover:bg-surface-200 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-sm font-medium text-foreground">Keyboard shortcuts</h3>
                    </div>

                    {/* Shortcuts grid */}
                    <div className="px-4 py-4 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Focus search</span>
                          <kbd className="px-2 py-1 rounded bg-surface-200 border border-surface-300 text-xs text-foreground font-mono">⌘K</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">New prompt</span>
                          <kbd className="px-2 py-1 rounded bg-surface-200 border border-surface-300 text-xs text-foreground font-mono">⌘N</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Close modal</span>
                          <kbd className="px-2 py-1 rounded bg-surface-200 border border-surface-300 text-xs text-foreground font-mono">Esc</kbd>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-surface-200">
                        <p className="text-xs text-text-dim italic">More shortcuts coming soon</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline toast */}
      {toast && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
          toast.type === 'error'
            ? 'bg-red-500/20 border border-red-500/30 text-red-300'
            : 'bg-brand-500/20 border border-brand-500/30 text-brand-300'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
