interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: { text: "text-base", icon: "w-6 h-6 text-[0.55rem]" },
    md: { text: "text-xl", icon: "w-8 h-8 text-[0.65rem]" },
    lg: { text: "text-3xl", icon: "w-10 h-10 text-sm" },
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,43,0.3)] ${sizes[size].icon}`}
      >
        <span className="text-white font-display font-extrabold tracking-wide">
          SP
        </span>
      </div>
      <span
        className={`font-display font-bold tracking-tight text-foreground ${sizes[size].text}`}
        style={{ letterSpacing: "-0.02em" }}
      >
        super<span className="text-brand-400">prompts</span>
      </span>
    </div>
  );
}
