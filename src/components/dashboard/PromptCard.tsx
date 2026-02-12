'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Heart, Share2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PromptCardProps {
  id: string;
  title: string;
  content: string;
  coverUrl?: string | null;
  coverType?: 'image' | 'video';
  modelName?: string | null;
  modelSlug?: string | null;
  isFavorite?: boolean;
  tags?: string[];
  onCopy?: () => void;
  onFavorite?: () => void;
  onClick?: () => void;
}

const getGradientBackground = (seed: string): string => {
  const colors = [
    'from-purple-900 to-pink-900',
    'from-blue-900 to-indigo-900',
    'from-cyan-900 to-blue-900',
    'from-emerald-900 to-teal-900',
    'from-orange-900 to-red-900',
  ];

  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export function PromptCard({
  id,
  title,
  content,
  coverUrl,
  coverType = 'image',
  modelName,
  modelSlug,
  isFavorite = false,
  tags = [],
  onCopy,
  onFavorite,
  onClick,
}: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavoritedLocally, setIsFavoritedLocally] = useState(isFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavoritedLocally(!isFavoritedLocally);
    onFavorite?.();
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy?.();
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Share functionality can be implemented later
  };

  const firstLine = content.split('\n')[0] || content.substring(0, 60);
  const gradientClass = getGradientBackground(id);

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-surface cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="article"
      aria-label={`Prompt: ${title}`}
    >
      {/* Cover Image/Video or Gradient Placeholder */}
      <div className="relative w-full aspect-[3/4] bg-background overflow-hidden">
        {coverUrl ? (
          <>
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
            {coverType === 'video' && !isHovered && (
              <div className="absolute bottom-3 left-3 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm transition-opacity duration-200">
                <Play size={18} className="text-white fill-white" />
              </div>
            )}
          </>
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-end justify-start p-6 bg-gradient-to-br',
              gradientClass
            )}
          >
            <p className="text-sm font-medium text-white/80 line-clamp-3">
              {firstLine}
            </p>
          </div>
        )}

        {/* Model Badge */}
        {modelName && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md border border-white/10 text-white/90 transition-all duration-200">
            {modelName}
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Hover Content */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 p-4 transition-all duration-200',
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          )}
        >
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-3">
            {title}
          </h3>

          {/* Action Icons */}
          <div className="flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyClick}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors duration-200"
                aria-label="Copy prompt"
                title="Copy prompt"
              >
                <Copy size={16} className="text-white" />
              </button>
              <button
                onClick={handleFavoriteClick}
                className={cn(
                  'p-2 rounded-lg backdrop-blur-sm border transition-all duration-200',
                  isFavoritedLocally
                    ? 'bg-red-500/30 border-red-400/50 text-red-300'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                )}
                aria-label={isFavoritedLocally ? 'Remove from favorites' : 'Add to favorites'}
                title={isFavoritedLocally ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  size={16}
                  className={isFavoritedLocally ? 'fill-current' : ''}
                />
              </button>
              <button
                onClick={handleShareClick}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors duration-200"
                aria-label="Share prompt"
                title="Share prompt"
              >
                <Share2 size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
