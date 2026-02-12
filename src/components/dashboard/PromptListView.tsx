'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Heart, ChevronDown, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PromptListViewProps {
  prompts: Array<{
    id: string;
    title: string;
    content: string;
    coverUrl?: string | null;
    coverType?: 'image' | 'video';
    modelName?: string | null;
    modelSlug?: string | null;
    isFavorite?: boolean;
    tags?: string[];
    createdAt?: string;
  }>;
  onCopyPrompt?: (id: string, content: string) => void;
  onFavoritePrompt?: (id: string) => void;
  onClickPrompt?: (id: string) => void;
}

type SortField = 'title' | 'model' | 'date';
type SortDirection = 'asc' | 'desc';

export function PromptListView({
  prompts,
  onCopyPrompt,
  onFavoritePrompt,
  onClickPrompt,
}: PromptListViewProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>(
    prompts.reduce(
      (acc, p) => ({ ...acc, [p.id]: p.isFavorite || false }),
      {}
    )
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFavoriteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteMap((prev) => ({ ...prev, [id]: !prev[id] }));
    onFavoritePrompt?.(id);
  };

  const handleCopyClick = (id: string, content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyPrompt?.(id, content);
  };

  const sortedPrompts = [...prompts].sort((a, b) => {
    let compareValue = 0;

    switch (sortField) {
      case 'title':
        compareValue = a.title.localeCompare(b.title);
        break;
      case 'model':
        compareValue = (a.modelName || '').localeCompare(b.modelName || '');
        break;
      case 'date':
        compareValue =
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime();
        break;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  const SortButton = ({
    label,
    field,
  }: {
    label: string;
    field: SortField;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-foreground transition-colors duration-200"
    >
      {label}
      {sortField === field && (
        <ChevronDown
          size={14}
          className={cn(
            'transition-transform duration-200',
            sortDirection === 'desc' ? 'rotate-0' : 'rotate-180'
          )}
        />
      )}
    </button>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-4">
        <div className="flex-1 flex items-center gap-8">
          <div className="w-12" />
          <SortButton label="TITLE" field="title" />
          <SortButton label="MODEL" field="model" />
          <div className="text-xs font-medium text-text-muted">TAGS</div>
          <SortButton label="DATE" field="date" />
        </div>
        <div className="w-16" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {sortedPrompts.map((prompt, index) => {
          const isFavorited = favoriteMap[prompt.id];

          return (
            <div
              key={prompt.id}
              className={cn(
                'px-4 py-3 flex items-center gap-4 group transition-colors duration-200 cursor-pointer',
                'hover:bg-white/5'
              )}
              onClick={() => onClickPrompt?.(prompt.id)}
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-surface">
                {prompt.coverUrl ? (
                  <>
                    <Image
                      src={prompt.coverUrl}
                      alt={prompt.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                    {prompt.coverType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play size={12} className="text-white fill-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-pink-900/40" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center gap-8 min-w-0">
                {/* Title */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {prompt.title}
                  </h4>
                </div>

                {/* Model */}
                <div className="min-w-[120px]">
                  {prompt.modelName && (
                    <span className="text-xs font-medium text-text-muted bg-white/5 px-2 py-1 rounded">
                      {prompt.modelName}
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1 min-w-[100px]">
                  {prompt.tags && prompt.tags.length > 0 ? (
                    <span className="text-xs text-text-muted truncate">
                      {prompt.tags.slice(0, 2).join(', ')}
                      {prompt.tags.length > 2 && ` +${prompt.tags.length - 2}`}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted opacity-40">
                      —
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="min-w-[100px]">
                  <span className="text-xs text-text-muted">
                    {prompt.createdAt
                      ? new Date(prompt.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                <button
                  onClick={(e) => handleCopyClick(prompt.id, prompt.content, e)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors duration-200"
                  aria-label="Copy prompt"
                  title="Copy prompt"
                >
                  <Copy size={16} className="text-text-muted hover:text-foreground" />
                </button>
                <button
                  onClick={(e) => handleFavoriteClick(prompt.id, e)}
                  className={cn(
                    'p-1.5 rounded transition-colors duration-200',
                    isFavorited
                      ? 'text-red-400 hover:bg-red-500/20'
                      : 'text-text-muted hover:bg-white/10 hover:text-foreground'
                  )}
                  aria-label={
                    isFavorited ? 'Remove from favorites' : 'Add to favorites'
                  }
                  title={
                    isFavorited ? 'Remove from favorites' : 'Add to favorites'
                  }
                >
                  <Heart
                    size={16}
                    className={isFavorited ? 'fill-current' : ''}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
