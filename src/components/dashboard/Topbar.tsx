"use client";

import { useState, useRef, useEffect } from "react";
import { PlusIcon } from "@/components/icons/Logo";
import { useCreatePromptModal } from "@/contexts/CreatePromptContext";

interface TopbarProps {
  onMenuToggle: () => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  onCreatePrompt?: () => void;
}

export default function Topbar({
  onMenuToggle,
  viewMode,
  setViewMode,
  onCreatePrompt,
}: TopbarProps) {
  const { openCreateModal } = useCreatePromptModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleCreateClick = () => {
    onCreatePrompt?.();
    openCreateModal();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-surface-200">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Hamburger + Search */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors md:hidden flex-shrink-0"
          >
            <svg
              className="w-5 h-5 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Search Input */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-100 border border-surface-200 rounded-lg text-sm text-foreground placeholder-text-dim focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right: View Toggle + New Prompt + User Menu */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Grid/List Toggle */}
          <div className="hidden sm:flex items-center gap-2 bg-surface-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded transition-all ${
                viewMode === "grid"
                  ? "bg-surface-300 text-foreground"
                  : "text-text-muted hover:text-foreground"
              }`}
              title="Grid view"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded transition-all ${
                viewMode === "list"
                  ? "bg-surface-300 text-foreground"
                  : "text-text-muted hover:text-foreground"
              }`}
              title="List view"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* New Prompt Button */}
          <button
            onClick={handleCreateClick}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 text-white rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 font-medium text-sm"
            title="Create new prompt"
          >
            <PlusIcon size={16} />
            <span>New Prompt</span>
          </button>

          {/* Compact New Prompt Button (Mobile) */}
          <button
            onClick={handleCreateClick}
            className="sm:hidden p-2.5 bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 text-white rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 flex-shrink-0"
            title="Create new prompt"
          >
            <PlusIcon size={16} />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="p-2 hover:bg-surface-100 rounded-lg transition-colors flex-shrink-0"
            >
              {/* User Avatar Circle */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
            </button>

            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-100 border border-surface-200 rounded-lg shadow-2xl shadow-black/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-200">
                  <p className="text-sm font-medium text-foreground">
                    alex@example.com
                  </p>
                  <p className="text-xs text-text-dim">Pro Plan</p>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors">
                    Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-surface-200 hover:text-foreground transition-colors">
                    Help & Support
                  </button>
                </div>
                <div className="border-t border-surface-200 py-2">
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-surface-200 hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
