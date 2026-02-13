'use client';

import { useState, useEffect, useRef } from 'react';
import { PromptCard, type MediaItem } from './PromptCard';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';

export type GridSortField = 'newest' | 'oldest' | 'title_az' | 'title_za';

export interface PromptGridProps {
  prompts: Array<{
    id: string;
    title: string;
    content: string;
    coverUrl?: string | null;
    coverType?: 'image' | 'video';
    mediaItems?: MediaItem[];
    modelName?: string | null;
    modelSlug?: string | null;
    modelCategory?: string | null;
    contentType?: string | null;
    isFavorite?: boolean;
    tags?: string[];
    createdAt?: string;
    folderIds?: string[];
  }>;
  onCopyPrompt?: (id: string, content: string) => void;
  onFavoritePrompt?: (id: string) => void;
  onClickPrompt?: (id: string) => void;
  selectedPromptId?: string | null;
  onSelectPrompt?: (id: string) => void;
  folders?: Array<{ id: string; name: string }>;
  selectedFolderId?: string | null;
  onAssignPromptToFolder?: (promptId: string, folderId: string) => void;
  onRemovePromptFromCurrentFolder?: (promptId: string) => void;
}

const SORT_OPTIONS: { value: GridSortField; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title_az', label: 'Title A→Z' },
  { value: 'title_za', label: 'Title Z→A' },
];

export function PromptGrid({
  prompts,
  onCopyPrompt,
  onFavoritePrompt,
  onClickPrompt,
  selectedPromptId,
  onSelectPrompt,
  folders = [],
  selectedFolderId = null,
  onAssignPromptToFolder,
  onRemovePromptFromCurrentFolder,
}: PromptGridProps) {
  const { setDraggedPromptId } = useDashboard();
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] = useState<GridSortField>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  // Trigger fade-in shortly after mount using setTimeout for reliability
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [sortOpen]);

  if (prompts.length === 0) {
    return null;
  }

  // Sort prompts
  const sortedPrompts = [...prompts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case 'title_az':
        return a.title.localeCompare(b.title);
      case 'title_za':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  const currentLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Newest first';

  return (
    <div className="w-full">
      {/* Sort controls — custom dropdown for precise chevron positioning */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-dim">Sort:</span>
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 text-xs bg-surface-100 border border-surface-200 rounded-lg px-3 py-1.5 text-foreground hover:border-surface-300 focus:outline-none focus:border-brand-400 cursor-pointer transition-colors"
            >
              <span>{currentLabel}</span>
              <ChevronDown size={13} className={cn('text-text-muted transition-transform duration-200', sortOpen && 'rotate-180')} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-surface-100 border border-surface-200 rounded-lg shadow-xl overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer',
                      sortBy === opt.value
                        ? 'bg-brand-500/15 text-brand-300'
                        : 'text-text-muted hover:text-foreground hover:bg-surface-200'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid — auto-fill with minmax to prevent cards from squishing on resize */}
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2 sm:gap-3">
        {sortedPrompts.map((prompt, index) => (
          <div
            key={prompt.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-superprompts-prompt-id', prompt.id);
              event.dataTransfer.setData('text/plain', prompt.id);
              event.dataTransfer.effectAllowed = 'copyMove';
              setDraggedPromptId(prompt.id);

              // Use a compact drag preview so the large card doesn't cover folder targets.
              const preview = document.createElement('div');
              preview.textContent = `+ ${prompt.title}`;
              preview.style.position = 'fixed';
              preview.style.top = '-1000px';
              preview.style.left = '-1000px';
              preview.style.padding = '8px 12px';
              preview.style.borderRadius = '999px';
              preview.style.fontSize = '12px';
              preview.style.fontWeight = '600';
              preview.style.color = '#f5f5f5';
              preview.style.background = 'rgba(10,10,10,0.92)';
              preview.style.border = '1px solid rgba(232,118,75,0.65)';
              preview.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
              preview.style.maxWidth = '260px';
              preview.style.whiteSpace = 'nowrap';
              preview.style.overflow = 'hidden';
              preview.style.textOverflow = 'ellipsis';
              preview.style.pointerEvents = 'none';
              document.body.appendChild(preview);
              dragPreviewRef.current = preview;
              event.dataTransfer.setDragImage(preview, 18, 18);
            }}
            onDragEnd={() => {
              setDraggedPromptId(null);
              if (dragPreviewRef.current) {
                dragPreviewRef.current.remove();
                dragPreviewRef.current = null;
              }
            }}
            className={cn(
              'transition-all duration-700 ease-out cursor-grab active:cursor-grabbing rounded-lg',
              selectedPromptId === prompt.id ? 'ring-2 ring-brand-400/60 ring-offset-2 ring-offset-background' : '',
              mounted
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
            style={{
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <PromptCard
              id={prompt.id}
              title={prompt.title}
              content={prompt.content}
              coverUrl={prompt.coverUrl}
              coverType={prompt.coverType}
              mediaItems={prompt.mediaItems}
              modelName={prompt.modelName}
              modelSlug={prompt.modelSlug}
              modelCategory={prompt.modelCategory}
              contentType={prompt.contentType}
              isFavorite={prompt.isFavorite}
              tags={prompt.tags}
              folders={folders}
              selectedFolderId={selectedFolderId}
              folderIds={prompt.folderIds || []}
              onAssignToFolder={(folderId) => onAssignPromptToFolder?.(prompt.id, folderId)}
              onRemoveFromCurrentFolder={onRemovePromptFromCurrentFolder ? () => onRemovePromptFromCurrentFolder(prompt.id) : undefined}
              onCopy={() => onCopyPrompt?.(prompt.id, prompt.content)}
              onFavorite={() => onFavoritePrompt?.(prompt.id)}
              onClick={() => {
                onSelectPrompt?.(prompt.id);
                onClickPrompt?.(prompt.id);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
