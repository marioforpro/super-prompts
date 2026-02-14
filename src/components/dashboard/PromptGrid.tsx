'use client';

import { useState, useEffect, useRef } from 'react';
import { PromptCard, type MediaItem } from './PromptCard';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';

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
  onEditPrompt?: (id: string) => void;
  onSharePrompt?: (id: string) => void;
  onDeletePrompt?: (promptId: string) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (promptId: string) => void;
}

export function PromptGrid({
  prompts,
  onCopyPrompt,
  onFavoritePrompt,
  onClickPrompt,
  selectedPromptId,
  onSelectPrompt,
  onEditPrompt,
  onSharePrompt,
  onDeletePrompt,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
}: PromptGridProps) {
  const { setDraggedPromptId, setDraggedPromptIds } = useDashboard();
  const [mounted, setMounted] = useState(false);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);
  const suppressNextDragRef = useRef(false);

  // Trigger fade-in shortly after mount using setTimeout for reliability
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (dragPreviewRef.current) {
        dragPreviewRef.current.remove();
        dragPreviewRef.current = null;
      }
    };
  }, []);

  if (prompts.length === 0) {
    return null;
  }

  const sortedPrompts = [...prompts].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return (
    <div className="w-full">
      {/* Grid — auto-fill with minmax to prevent cards from squishing on resize */}
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2 sm:gap-3">
        {sortedPrompts.map((prompt, index) => (
          <div
            key={prompt.id}
            draggable
            onPointerDownCapture={(event) => {
              const target = event.target as HTMLElement;
              suppressNextDragRef.current = !!target.closest('[data-no-card-drag="true"]');
            }}
            onPointerUpCapture={() => {
              suppressNextDragRef.current = false;
            }}
            onDragStart={(event) => {
              if (suppressNextDragRef.current) {
                event.preventDefault();
                return;
              }
              const target = event.target as HTMLElement;
              if (target.closest('button') || target.closest('[role="menu"]')) {
                event.preventDefault();
                return;
              }
              if (dragPreviewRef.current) {
                dragPreviewRef.current.remove();
                dragPreviewRef.current = null;
              }
              const draggedIds = selectedIds.includes(prompt.id) && selectedIds.length > 0
                ? selectedIds
                : [prompt.id];
              event.dataTransfer.setData('application/x-superprompts-prompt-id', prompt.id);
              event.dataTransfer.setData('application/x-superprompts-prompt-ids', JSON.stringify(draggedIds));
              event.dataTransfer.setData('text/plain', prompt.id);
              event.dataTransfer.effectAllowed = 'copyMove';
              setDraggedPromptId(prompt.id);
              setDraggedPromptIds(draggedIds);

              // Use a compact drag preview so the large card doesn't cover folder targets.
              const preview = document.createElement('div');
              preview.textContent = draggedIds.length > 1 ? `+ ${draggedIds.length} prompts` : `+ ${prompt.title}`;
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
              suppressNextDragRef.current = false;
              if (dragPreviewRef.current) {
                dragPreviewRef.current.remove();
                dragPreviewRef.current = null;
              }
            }}
            className={cn(
              'transition-all duration-700 ease-out cursor-grab active:cursor-grabbing rounded-lg',
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
              onEdit={onEditPrompt ? () => onEditPrompt(prompt.id) : undefined}
              onShare={onSharePrompt ? () => onSharePrompt(prompt.id) : undefined}
              onDelete={onDeletePrompt ? () => onDeletePrompt(prompt.id) : undefined}
              selectable={selectable}
              selected={selectedIds.includes(prompt.id)}
              onToggleSelected={() => onToggleSelect?.(prompt.id)}
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
