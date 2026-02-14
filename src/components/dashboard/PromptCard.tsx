'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Copy, Heart, Play, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, SquarePen, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PromptBrandPlaceholder from './PromptBrandPlaceholder';

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
  contentType?: string | null;
  isFavorite?: boolean;
  tags?: string[];
  onEdit?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
  onCopy?: () => void;
  onFavorite?: () => void;
  onClick?: () => void;
}

/**
 * Returns the aspect ratio class for consistent grid layout.
 * Standardized aspect ratio for all content types.
 * Individual aspect ratios are shown in the detail/modal view.
 */
function getAspectRatio(category?: string | null): string {
  // Standardized aspect ratio for consistent grid layout
  // Individual aspect ratios are shown in the detail/modal view
  return 'aspect-[4/5]';
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
  onEdit,
  onShare,
  onDelete,
  selectable = false,
  selected = false,
  onToggleSelected,
  onCopy,
  onFavorite,
  onClick,
}: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavoritedLocally, setIsFavoritedLocally] = useState(isFavorite);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showCopied, setShowCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
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
  const aspectClass = getAspectRatio(modelCategory);
  useEffect(() => {
    if (!menuOpen) return;
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuPanelRef.current?.contains(target)) return;
      if (menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(12, rect.right - 180),
    });
    const close = () => setMenuOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menuOpen]);

  const closeMenuAndRun = (action?: () => void) => {
    action?.();
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnBlur = () => setMenuOpen(false);
    window.addEventListener('blur', closeOnBlur);
    return () => window.removeEventListener('blur', closeOnBlur);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnTouch = (event: TouchEvent) => {
      const target = event.target as Node;
      if (menuPanelRef.current?.contains(target)) return;
      if (menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('touchstart', closeOnTouch, { passive: true });
    return () => document.removeEventListener('touchstart', closeOnTouch);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => {
      if (document.visibilityState === 'hidden') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('visibilitychange', close);
    return () => {
      document.removeEventListener('visibilitychange', close);
    };
  }, [menuOpen]);

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-surface cursor-pointer transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        onClick?.();
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
      role="article"
      aria-label={`Prompt: ${title}`}
      tabIndex={0}
    >
      {/* Cover Image/Video or Gradient Placeholder */}
      <div className={cn('relative w-full bg-black overflow-hidden', aspectClass)}>
        {displayMedia.length > 0 ? (
          <>
            {/* Sliding media strip */}
            <div className="relative w-full h-full overflow-hidden">
              <div
                className="flex h-full transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
              >
                {displayMedia.map((media, idx) => (
                  <div key={idx} className="relative min-w-full h-full flex-shrink-0 overflow-hidden">
                    <div
                      className="w-full h-full transition-transform duration-300 transform-gpu will-change-transform group-hover:scale-[1.03]"
                    >
                      {media.type === 'video' ? (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          draggable={false}
                        />
                      ) : (
                        <Image
                          src={media.url}
                          alt={`${title} - ${idx + 1}`}
                          fill
                          quality={92}
                          draggable={false}
                          className="object-cover"
                          style={(media.cropX !== undefined || media.cropScale !== undefined) ? {
                            objectPosition: `${media.cropX ?? 50}% ${media.cropY ?? 50}%`,
                            transform: `scale(${media.cropScale ?? 1})`,
                            transformOrigin: `${media.cropX ?? 50}% ${media.cropY ?? 50}%`,
                          } : undefined}
                          sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        />
                      )}
                    </div>
                    {media.type === 'video' && !isHovered && idx === currentMediaIndex && (
                      <div className="absolute bottom-3 left-3 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm transition-opacity duration-200">
                        <Play size={18} className="text-white fill-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows — smaller, visible on hover */}
            {hasMultipleMedia && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); e.preventDefault(); setCurrentMediaIndex((prev) => (prev === 0 ? displayMedia.length - 1 : prev - 1)); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  className={cn(
                    'absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm pointer-events-auto',
                    'transition-all duration-200 hover:scale-110 active:scale-95',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                  aria-label="Previous media"
                  title="Previous media"
                >
                  <ChevronLeft size={14} className="text-white" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); e.preventDefault(); setCurrentMediaIndex((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1)); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm pointer-events-auto',
                    'transition-all duration-200 hover:scale-110 active:scale-95',
                    isHovered ? 'opacity-100' : 'opacity-0'
                  )}
                  aria-label="Next media"
                  title="Next media"
                >
                  <ChevronRight size={14} className="text-white" />
                </button>

                {/* Navigation Dots — centered */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
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
          <PromptBrandPlaceholder hint={firstLine} />
        )}

        {/* Badges — top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {modelName && (
            <div className="h-[30px] flex items-center px-3 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md border border-white/10 text-white/90 transition-all duration-200">
              {modelName}
            </div>
          )}
        </div>

        {/* Action Icon — top-right corner */}
        <div
          className={cn(
            'absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto transition-all duration-200',
            isHovered ? 'opacity-100' : 'opacity-0 [@media(hover:none)]:opacity-70'
          )}
        >
          <div className="relative">
            <button
              ref={menuButtonRef}
              data-no-card-drag="true"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setMenuOpen((prev) => !prev);
              }}
              draggable={false}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Prompt actions"
              title="Prompt actions"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
          <button
            onClick={handleFavoriteClick}
            data-no-card-drag="true"
            draggable={false}
            className={cn(
              'w-[30px] h-[30px] flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95',
              isFavoritedLocally
                ? 'bg-brand-500/50 text-brand-300 hover:bg-brand-500/70'
                : 'bg-black/40 hover:bg-black/60 text-white'
            )}
            aria-label={isFavoritedLocally ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavoritedLocally ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={14}
              className={isFavoritedLocally ? 'fill-current' : ''}
            />
          </button>
        </div>

        {/* Hover Content — primary copy action + title */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 px-4 pb-7 pt-10 transition-all duration-200 pointer-events-none translate-y-0 opacity-100"
        >
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleCopyClick}
              data-no-card-drag="true"
              draggable={false}
              className="pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/70 backdrop-blur-md border border-white/15 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Copy prompt"
              title="Copy prompt"
            >
              {showCopied ? (
                <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <Copy size={20} className="text-white" />
              )}
            </button>
            <h3
              className="text-sm font-semibold text-white line-clamp-2 text-center uppercase tracking-wide [text-shadow:0_2px_6px_rgba(0,0,0,0.72)]"
              style={{ WebkitTextStroke: "0.25px rgba(0, 0, 0, 0.75)" }}
            >
              {title}
            </h3>
          </div>
        </div>

        {selectable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelected?.();
            }}
            className={cn(
              'absolute right-3 bottom-3 z-30 w-6 h-6 rounded-sm border-2 transition-colors shadow-md',
              selected
                ? 'bg-brand-500 border-brand-300 shadow-brand-500/40'
                : 'bg-black/55 border-white/85 hover:border-brand-300'
            )}
            aria-label={selected ? 'Deselect prompt' : 'Select prompt'}
            title={selected ? 'Deselect prompt' : 'Select prompt'}
          >
            {selected && (
              <svg className="w-3 h-3 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {typeof document !== 'undefined' && menuOpen && menuPosition && createPortal(
        <div
          ref={menuPanelRef}
          role="menu"
          className="fixed z-[140] w-[180px] rounded-lg border border-surface-300 bg-surface-100 shadow-2xl overflow-hidden"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              closeMenuAndRun(onEdit);
            }}
            className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-xs text-text-muted hover:text-foreground hover:bg-surface-200"
          >
            <SquarePen size={12} />
            <span>Edit prompt</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              closeMenuAndRun(onShare);
            }}
            className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-xs text-text-muted hover:text-foreground hover:bg-surface-200"
          >
            <Share2 size={12} />
            <span>Share prompt</span>
          </button>
          <div className="h-px bg-surface-200" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              closeMenuAndRun(onDelete);
            }}
            className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-xs text-red-300 hover:text-red-200 hover:bg-red-500/15"
          >
            <Trash2 size={12} />
            <span>Delete prompt</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
