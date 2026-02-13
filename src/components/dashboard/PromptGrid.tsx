'use client';

import { useState, useEffect, useRef } from 'react';
import { PromptCard, type MediaItem } from './PromptCard';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

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
  }>;
  onCopyPrompt?: (id: string, content: string) => void;
  onFavoritePrompt?: (id: string) => void;
  onClickPrompt?: (id: string) => void;
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
}: PromptGridProps) {
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] = useState<GridSortField>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {sortedPrompts.map((prompt, index) => (
          <div
            key={prompt.id}
            className={cn(
              'transition-all duration-700 ease-out',
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
              onCopy={() => onCopyPrompt?.(prompt.id, prompt.content)}
              onFavorite={() => onFavoritePrompt?.(prompt.id)}
              onClick={() => onClickPrompt?.(prompt.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
