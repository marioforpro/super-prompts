'use client';

import { useState, useEffect } from 'react';
import { PromptCard } from './PromptCard';
import { cn } from '@/lib/utils';

export interface PromptGridProps {
  prompts: Array<{
    id: string;
    title: string;
    content: string;
    coverUrl?: string | null;
    coverType?: 'image' | 'video';
    modelName?: string | null;
    modelSlug?: string | null;
    modelCategory?: string | null;
    isFavorite?: boolean;
    tags?: string[];
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

  // Trigger fade-in shortly after mount using setTimeout for reliability
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full gap-1.5',
        'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5'
      )}
      style={{
        columnGap: '0.375rem', // 6px
      }}
    >
      {prompts.map((prompt, index) => (
          <div
            key={prompt.id}
            className={cn(
              'break-inside-avoid mb-1.5 inline-block w-full',
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
  );
}
