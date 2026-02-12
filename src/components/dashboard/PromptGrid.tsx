'use client';

import { useState, useEffect } from 'react';
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
    isFavorite?: boolean;
    tags?: string[];
    createdAt?: string;
  }>;
  onCopyPrompt?: (id: string, content: string) => void;
  onFavoritePrompt?: (id: string) => void;
  onClickPrompt?: (id: string) => void;
}

export function PromptGrid({
  prompts,
  onCopyPrompt,
  onFavoritePrompt,
  onClickPrompt,
}: PromptGridProps) {
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] = useState<GridSortField>('newest');

  // Trigger fade-in shortly after mount using setTimeout for reliability
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="w-full">
      {/* Sort controls */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-dim">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as GridSortField)}
            className="text-xs bg-surface-100 border border-surface-200 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-brand-400 cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title_az">Title A→Z</option>
            <option value="title_za">Title Z→A</option>
          </select>
        </div>
      </div>

      {/* Grid — row-based layout (left to right), larger cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
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
