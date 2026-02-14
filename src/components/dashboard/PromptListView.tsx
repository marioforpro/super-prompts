'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Copy, Heart, Play, SquarePen, Share2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';
import PromptBrandPlaceholder from './PromptBrandPlaceholder';

type ListSortMode = 'newest' | 'oldest' | 'title-az' | 'title-za' | 'model-az';

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
  onEditPrompt?: (id: string) => void;
  onSharePrompt?: (id: string) => void;
  onDeletePrompt?: (id: string) => void;
  onClickPrompt?: (id: string) => void;
  selectedPromptId?: string | null;
  onSelectPrompt?: (id: string) => void;
}

export function PromptListView({
  prompts,
  onCopyPrompt,
  onFavoritePrompt,
  onEditPrompt,
  onSharePrompt,
  onDeletePrompt,
  onClickPrompt,
  selectedPromptId,
  onSelectPrompt,
}: PromptListViewProps) {
  const { setDraggedPromptId, setDraggedPromptIds } = useDashboard();
  const [sortMode, setSortMode] = useState<ListSortMode>('newest');
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>(
    prompts.reduce(
      (acc, p) => ({ ...acc, [p.id]: p.isFavorite || false }),
      {}
    )
  );
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (dragPreviewRef.current) {
        dragPreviewRef.current.remove();
        dragPreviewRef.current = null;
      }
    };
  }, []);

  const handleFavoriteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteMap((prev) => ({ ...prev, [id]: !prev[id] }));
    onFavoritePrompt?.(id);
  };

  const handleCopyClick = (id: string, content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyPrompt?.(id, content);
  };
  const handleEditClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditPrompt?.(id);
  };
  const handleShareClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSharePrompt?.(id);
  };
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeletePrompt?.(id);
  };

  const sortedPrompts = [...prompts].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    switch (sortMode) {
      case 'oldest':
        return aTime - bTime;
      case 'title-az':
        return a.title.localeCompare(b.title);
      case 'title-za':
        return b.title.localeCompare(a.title);
      case 'model-az':
        return (a.modelName || '').localeCompare(b.modelName || '');
      case 'newest':
      default:
        return bTime - aTime;
    }
  });

  return (
    <div className="w-full rounded-xl border border-surface-200/80 bg-surface-100/28 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-end px-2.5 pt-2.5 pb-0.5">
        <select
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as ListSortMode)}
          className="h-8 rounded-lg border border-surface-300/80 bg-surface-100 px-2.5 text-xs text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500/60"
          aria-label="Sort prompts in list view"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title-az">Title A-Z</option>
          <option value="title-za">Title Z-A</option>
          <option value="model-az">Model A-Z</option>
        </select>
      </div>
      <div className="p-2.5 space-y-2">
        {sortedPrompts.map((prompt) => {
          const isFavorited = favoriteMap[prompt.id];
          const isSelected = selectedPromptId === prompt.id;

          return (
            <div
              key={prompt.id}
              draggable
              onDragStart={(event) => {
                if (dragPreviewRef.current) {
                  dragPreviewRef.current.remove();
                  dragPreviewRef.current = null;
                }
                event.dataTransfer.setData('application/x-superprompts-prompt-id', prompt.id);
                event.dataTransfer.setData('application/x-superprompts-prompt-ids', JSON.stringify([prompt.id]));
                event.dataTransfer.setData('text/plain', prompt.id);
                event.dataTransfer.effectAllowed = 'copyMove';
                setDraggedPromptId(prompt.id);
                setDraggedPromptIds([prompt.id]);

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
                setDraggedPromptIds([]);
                if (dragPreviewRef.current) {
                  dragPreviewRef.current.remove();
                  dragPreviewRef.current = null;
                }
              }}
              className="list-row px-3 py-2.5 grid items-center gap-3 group rounded-xl border border-surface-200/70 transition-all duration-200 cursor-pointer hover:border-brand-500/40"
              style={{
                gridTemplateColumns: '48px 1fr 120px 100px 142px',
                boxShadow: isSelected
                  ? 'inset 0 0 0 1px rgba(232,118,75,0.34), 0 12px 28px rgba(0,0,0,0.28)'
                  : '0 6px 16px rgba(0,0,0,0.18)',
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
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-surface-200">
                {prompt.coverUrl ? (
                  <>
                    {prompt.coverType === 'video' ? (
                      <video
                        src={prompt.coverUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        draggable={false}
                      />
                    ) : (
                      <Image
                        src={prompt.coverUrl}
                        alt={prompt.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        draggable={false}
                      />
                    )}
                    {prompt.coverType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play size={12} className="text-white fill-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <PromptBrandPlaceholder compact />
                )}
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate tracking-[0.03em] uppercase">{prompt.title}</h4>
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
                  <span className="text-xs font-medium text-text-muted bg-surface-200/70 px-2 py-1 rounded-full border border-surface-300/80">
                    {prompt.modelName}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted opacity-40">—</span>
                )}
              </div>

              <div className="hidden sm:block">
                <span className="text-xs text-text-dim">
                  {prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => handleCopyClick(prompt.id, prompt.content, e)}
                  className="p-1.5 rounded-lg border border-transparent hover:border-surface-300 hover:bg-surface-200 transition-colors duration-200"
                  aria-label="Copy prompt"
                  title="Copy prompt"
                >
                  <Copy size={14} className="text-text-muted hover:text-foreground" />
                </button>
                <button
                  onClick={(e) => handleFavoriteClick(prompt.id, e)}
                  className={cn(
                    'p-1.5 rounded-md border transition-colors duration-200',
                    isFavorited
                      ? 'text-red-400 border-red-500/25 hover:bg-red-500/20'
                      : 'text-text-muted border-transparent hover:border-surface-300 hover:bg-surface-200 hover:text-foreground'
                  )}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart size={14} className={isFavorited ? 'fill-current' : ''} />
                </button>
                <button
                  onClick={(e) => handleEditClick(prompt.id, e)}
                  className="p-1.5 rounded-lg border border-transparent hover:border-surface-300 hover:bg-surface-200 transition-colors duration-200"
                  aria-label="Edit prompt"
                  title="Edit prompt"
                >
                  <SquarePen size={14} className="text-text-muted hover:text-foreground" />
                </button>
                <button
                  onClick={(e) => handleShareClick(prompt.id, e)}
                  className="p-1.5 rounded-lg border border-transparent hover:border-surface-300 hover:bg-surface-200 transition-colors duration-200"
                  aria-label="Share prompt"
                  title="Share prompt"
                >
                  <Share2 size={14} className="text-text-muted hover:text-foreground" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(prompt.id, e)}
                  className="p-1.5 rounded-lg border border-transparent hover:border-red-500/35 hover:bg-red-500/12 transition-colors duration-200"
                  aria-label="Delete prompt"
                  title="Delete prompt"
                >
                  <Trash2 size={14} className="text-text-muted hover:text-red-300" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
