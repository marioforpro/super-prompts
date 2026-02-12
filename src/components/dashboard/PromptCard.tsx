'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Heart, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  frameFit: 'cover' | 'contain' | 'fill';
  cropX?: number;
  cropY?: number;
  cropScale?: number;
}

export interface PromptCardProps {
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

/**
 * Returns the aspect ratio class based on model category:
 * - image: 3:4 portrait (default)
 * - video: 16:9 landscape
 * - audio: 1:1 square
 * - text/other: 3:4 portrait
 */
function getAspectRatio(category?: string | null): string {
  switch (category) {
    case 'video':
      return 'aspect-video'; // 16:9
    case 'audio':
      return 'aspect-square'; // 1:1
    default:
      return 'aspect-[3/4]'; // portrait
  }
}

export function PromptCard({
  id,
  title,
  content,
  coverUrl,
  coverType = 'image',
  mediaItems,
  modelName,
  modelSlug,
  modelCategory,
  isFavorite = false,
  tags = [],
  onCopy,
  onFavorite,
  onClick,
}: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavoritedLocally, setIsFavoritedLocally] = useState(isFavorite);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Use mediaItems if provided, otherwise fall back to coverUrl/coverType
  const displayMedia = mediaItems && mediaItems.length > 0
    ? mediaItems
    : (coverUrl ? [{ url: coverUrl, type: coverType, frameFit: 'cover' as const }] : []);

  const hasMultipleMedia = displayMedia.length > 1;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavoritedLocally(!isFavoritedLocally);
    onFavorite?.();
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy?.();
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentMediaIndex((prev) => (prev === 0 ? displayMedia.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentMediaIndex((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentMediaIndex(index);
  };

  const firstLine = content.split('\n')[0] || content.substring(0, 60);
  const gradientClass = getGradientBackground(id);
  const aspectClass = getAspectRatio(modelCategory);

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-surface cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        onClick?.();
      }}
      role="article"
      aria-label={`Prompt: ${title}`}
    >
      {/* Cover Image/Video or Gradient Placeholder */}
      <div className={cn('relative w-full bg-background overflow-hidden', aspectClass)}>
        {displayMedia.length > 0 ? (
          <>
            {/* Sliding media strip */}
            <div className="relative w-full h-full overflow-hidden">
              <div
                className="flex h-full transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
              >
                {displayMedia.map((media, idx) => (
                  <div key={idx} className="relative w-full h-full flex-shrink-0">
                    {media.frameFit === 'contain' && (
                      <div className="absolute inset-0 bg-gray-900" />
                    )}
                    <Image
                      src={media.url}
                      alt={`${title} - ${idx + 1}`}
                      fill
                      className={cn(
                        'transition-transform duration-300 group-hover:scale-110',
                        media.frameFit === 'cover' && 'object-cover',
                        media.frameFit === 'contain' && 'object-contain',
                        media.frameFit === 'fill' && 'object-fill'
                      )}
                      style={media.frameFit === 'cover' && (media.cropX !== undefined || media.cropScale !== undefined) ? {
                        objectPosition: `${media.cropX ?? 50}% ${media.cropY ?? 50}%`,
                        transform: `scale(${media.cropScale ?? 1})`,
                      } : undefined}
                      sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                    {media.type === 'video' && !isHovered && idx === currentMediaIndex && (
                      <div className="absolute bottom-3 left-3 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm transition-opacity duration-200">
                        <Play size={18} className="text-white fill-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows (visible only on hover when multiple media items exist) */}
            {hasMultipleMedia && (
              <>
                <button
                  onClick={handlePrevious}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 transition-opacity duration-200',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                  aria-label="Previous media"
                  title="Previous media"
                >
                  <ChevronLeft size={12} className="text-white" />
                </button>

                <button
                  onClick={handleNext}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 transition-opacity duration-200',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                  aria-label="Next media"
                  title="Next media"
                >
                  <ChevronRight size={12} className="text-white" />
                </button>

                {/* Navigation Dots */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
                  {displayMedia.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleDotClick(index, e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        'rounded-full transition-all duration-200',
                        currentMediaIndex === index
                          ? 'w-1.5 h-1.5 bg-brand-400'
                          : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                      )}
                      aria-label={`Go to media ${index + 1}`}
                      title={`Go to media ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-end justify-start p-6 bg-gradient-to-br',
              gradientClass
            )}
          >
            <p className={cn(
              'text-sm font-medium text-white/80 line-clamp-3 transition-opacity duration-200',
              isHovered ? 'opacity-0' : 'opacity-100'
            )}>
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
            'absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-200 pointer-events-none',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Hover Content — title + actions only */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-20 p-4 transition-all duration-200',
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          )}
        >
          <h3 className="text-sm font-semibold text-white line-clamp-2 mb-3">
            {title}
          </h3>

          {/* Action Icons — copy + favorite only */}
          <div className="flex items-center justify-end gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
