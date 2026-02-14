"use client";

import { PlusIcon } from "@/components/icons/Logo";
import { cn } from "@/lib/utils";

interface PromptBrandPlaceholderProps {
  compact?: boolean;
  hint?: string;
  className?: string;
}

export default function PromptBrandPlaceholder({
  compact = false,
  hint,
  className,
}: PromptBrandPlaceholderProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "w-full h-full relative overflow-hidden bg-gradient-to-br from-[#171723] via-[#111320] to-[#0b0d16]",
          className
        )}
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_15%,rgba(240,144,112,0.35),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(208,104,64,0.25),transparent_50%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <PlusIcon size={18} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-full relative overflow-hidden bg-gradient-to-br from-[#171723] via-[#111320] to-[#0b0d16]",
        className
      )}
    >
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_15%_20%,rgba(240,144,112,0.36),transparent_52%),radial-gradient(circle_at_85%_75%,rgba(208,104,64,0.26),transparent_46%)]" />
      <div className="absolute inset-0 opacity-[0.16] bg-[linear-gradient(115deg,transparent_0%,transparent_47%,rgba(255,255,255,0.35)_50%,transparent_53%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        <PlusIcon size={34} />
        <p className="mt-3 text-[10px] font-semibold tracking-[0.24em] text-white/75 uppercase">
          Super Prompts
        </p>
        {hint && (
          <p className="mt-2 max-w-[180px] text-[11px] text-white/55 line-clamp-2">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
