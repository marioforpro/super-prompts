'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  onCreateClick?: () => void;
  onCreatePrompt?: () => void;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}

export function EmptyState({
  onCreateClick,
  onCreatePrompt,
  title = 'NO PROMPTS YET',
  subtitle = 'Save your first prompt to get started',
  buttonLabel = '+ NEW PROMPT',
}: EmptyStateProps) {
  const handleClick = onCreateClick || onCreatePrompt;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Illustration */}
      <div className="mb-8 relative">
        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-white/10 flex items-center justify-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-text-muted opacity-60"
          >
            <path
              d="M16 8C16 6.89543 16.8954 6 18 6H46C47.1046 6 48 6.89543 48 8V48C48 49.1046 47.1046 50 46 50H18C16.8954 50 16 49.1046 16 48V8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="16" r="2" fill="currentColor" />
            <path
              d="M16 28L24 20L32 28L48 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="32" r="2" fill="currentColor" />
            <path
              d="M16 44L20 40L28 48"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground text-center mb-2 tracking-tight">
        {title}
      </h2>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-text-muted text-center mb-8 max-w-md">
        {subtitle}
      </p>

      {/* CTA Button */}
      <button
        onClick={handleClick}
        className={cn(
          'px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200',
          'bg-gradient-to-r from-brand-coral to-pink-600',
          'hover:shadow-lg hover:shadow-brand-coral/50 hover:scale-105',
          'text-white font-display',
          'flex items-center gap-2'
        )}
      >
        <Plus size={18} />
        {buttonLabel}
      </button>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-t from-brand-coral/5 to-transparent rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
