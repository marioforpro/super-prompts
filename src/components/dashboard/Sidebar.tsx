"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/icons/Logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  activeNav,
  setActiveNav,
}: SidebarProps) {
  const [showFoldersMenu, setShowFoldersMenu] = useState(true);
  const [showModelsMenu, setShowModelsMenu] = useState(true);
  const [showTagsMenu, setShowTagsMenu] = useState(true);

  const navItems = [
    { id: "all-prompts", label: "All Prompts" },
    { id: "favorites", label: "Favorites" },
  ];

  const models = [
    "Midjourney",
    "DALL-E 3",
    "Stable Diffusion",
    "Flux",
    "Runway",
    "Kling",
    "Sora",
  ];

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    // On mobile, close sidebar after navigation
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with Logo */}
      <div className="px-5 py-6 border-b border-surface-200">
        <Link href="/dashboard" onClick={() => handleNavClick("all-prompts")}>
          <Logo size="sm" showText={true} />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-2">
        {/* Primary Nav Items */}
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                    : "text-text-muted hover:text-foreground hover:bg-surface-100"
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-surface-200 my-4" />

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <span
              className="text-xs font-bold tracking-widest text-text-dim uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Folders
            </span>
            <button
              className="p-1 hover:bg-surface-100 rounded transition-colors"
              title="Create new folder"
            >
              <svg
                className="w-4 h-4 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          {showFoldersMenu && (
            <div className="mt-2 space-y-1 pl-2">
              <button className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors">
                My Projects
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors">
                Creative Briefs
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors">
                Templates
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-surface-200 my-4" />

        {/* AI Models Section */}
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <span
              className="text-xs font-bold tracking-widest text-text-dim uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              AI Models
            </span>
          </div>
          {showModelsMenu && (
            <div className="mt-2 space-y-1 pl-2">
              {models.map((model) => (
                <button
                  key={model}
                  className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors"
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-surface-200 my-4" />

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <span
              className="text-xs font-bold tracking-widest text-text-dim uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Tags
            </span>
          </div>
          {showTagsMenu && (
            <div className="mt-2 space-y-1 pl-2">
              <button className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors">
                #copywriting
              </button>
              <button className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors">
                #design
              </button>
              <button className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors">
                #brainstorm
              </button>
              <button className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-100 rounded transition-colors">
                #video
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Footer: Sign Out */}
      <div className="border-t border-surface-200 px-3 py-4">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm text-text-muted hover:text-white hover:bg-surface-100 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — Desktop: Always visible, Mobile: Slide-out drawer */}
      <div
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-surface z-50 border-r border-surface-200 transition-transform duration-300 transform md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-100 md:hidden"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Sidebar Content */}
        {sidebarContent}
      </div>
    </>
  );
}
