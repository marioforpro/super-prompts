interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  const iconSizes = { sm: "w-6 h-6 text-xs", md: "w-8 h-8 text-sm", lg: "w-10 h-10 text-base" };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center ${iconSizes[size]}`}>
        <span className="text-white font-bold">SP</span>
      </div>
      <span className={`font-bold tracking-tight text-white ${sizes[size]}`}>
        Super<span className="text-brand-400">Prompts</span>
      </span>
    </div>
  );
}
