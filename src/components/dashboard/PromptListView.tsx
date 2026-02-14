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
    contentType?: string | null;
    isFavorite?: boolean;
    tags?: string[];
    createdAt?: string;
  }>;
  onCopyPrompt?: (id: string, content: string) => void;
  onFavoritePrompt?: (id: string) => void;
  onClickPrompt?: (id: string) => void;
  selectedPromptId?: string | null;
  onSelectPrompt?: (id: string) => void;
}

type SortField = 'title' | 'model' | 'date';
type SortDirection = 'asc' | 'desc';

function SortButton({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-foreground transition-colors duration-200"
    >
      {label}
      {sortField === field && (
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-200 ml-0.5',
            sortDirection === 'desc' ? 'rotate-0' : 'rotate-180'
          )}
        />
      )}
    </button>
  );
}

export function PromptListView({
  prompts,
  onCopyPrompt,
  onFavoritePrompt,
  onClickPrompt,
  selectedPromptId,
  onSelectPrompt,
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

  return (
    <div className="w-full">
      <div className="px-4 py-3 border-b border-white/5 grid items-center gap-3" style={{ gridTemplateColumns: '48px 1fr 120px 100px 64px' }}>
        <div />
        <SortButton label="TITLE" field="title" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
        <div className="hidden md:block"><SortButton label="MODEL" field="model" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} /></div>
        <div className="hidden sm:block"><SortButton label="DATE" field="date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} /></div>
        <div />
      </div>

      <div className="divide-y divide-white/5">
        {sortedPrompts.map((prompt) => {
          const isFavorited = favoriteMap[prompt.id];
          const isSelected = selectedPromptId === prompt.id;

          return (
            <div
              key={prompt.id}
              className="px-4 py-3 grid items-center gap-3 group transition-colors duration-200 cursor-pointer hover:bg-white/5"
              style={{
                gridTemplateColumns: '48px 1fr 120px 100px 64px',
                backgroundColor: isSelected ? 'rgba(232,118,75,0.08)' : undefined,
                boxShadow: isSelected ? 'inset 0 0 0 1px rgba(232,118,75,0.45)' : undefined,
              }}
              onClick={() => {
                onSelectPrompt?.(prompt.id);
                onClickPrompt?.(prompt.id);
              }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSelectPrompt?.(prompt.id);
                  onClickPrompt?.(prompt.id);
                }
              }}
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0 bg-surface">
                {prompt.coverUrl ? (
                  <>
                    {prompt.coverType === 'video' ? (
                      <video
                        src={prompt.coverUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <Image
                        src={prompt.coverUrl}
                        alt={prompt.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    )}
                    {prompt.coverType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play size={12} className="text-white fill-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-900/40 to-amber-900/40" />
                )}
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{prompt.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  {prompt.modelName && (
                    <span className="md:hidden text-xs text-text-dim shrink-0">{prompt.modelName}</span>
                  )}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <span className="text-xs text-text-dim truncate">
                      {prompt.tags.slice(0, 2).join(', ')}
                      {prompt.tags.length > 2 && ` +${prompt.tags.length - 2}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden md:block">
                {prompt.modelName ? (
                  <span className="text-xs font-medium text-text-muted bg-white/5 px-2 py-1 rounded">
                    {prompt.modelName}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted opacity-40">—</span>
                )}
              </div>

              <div className="hidden sm:block">
                <span className="text-xs text-text-muted">
                  {prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => handleCopyClick(prompt.id, prompt.content, e)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors duration-200"
                  aria-label="Copy prompt"
                  title="Copy prompt"
                >
                  <Copy size={14} className="text-text-muted hover:text-foreground" />
                </button>
                <button
                  onClick={(e) => handleFavoriteClick(prompt.id, e)}
                  className={cn(
                    'p-1.5 rounded transition-colors duration-200',
                    isFavorited
                      ? 'text-red-400 hover:bg-red-500/20'
                      : 'text-text-muted hover:bg-white/10 hover:text-foreground'
                  )}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart size={14} className={isFavorited ? 'fill-current' : ''} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
