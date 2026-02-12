interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({
  className = "",
  size = "md",
  showText = true,
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-sm", gap: "gap-2" },
    md: { icon: 30, text: "text-base", gap: "gap-2.5" },
    lg: { icon: 40, text: "text-xl", gap: "gap-3" },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* The + icon — creative orange plus sign with rounded edges */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Rounded square background */}
          <rect
            x="0"
            y="0"
            width="40"
            height="40"
            rx="10"
            fill="url(#plusGrad)"
          />
          {/* Plus sign — thick, rounded ends */}
          <rect x="11" y="17.5" width="18" height="5" rx="2.5" fill="white" />
          <rect x="17.5" y="11" width="5" height="18" rx="2.5" fill="white" />
          <defs>
            <linearGradient
              id="plusGrad"
              x1="0"
              y1="0"
              x2="40"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#ff8b3b" />
              <stop offset="1" stopColor="#ff5a1b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span
          className={`font-bold tracking-[0.12em] uppercase text-foreground ${s.text}`}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          SUPER
          <span className="text-brand-400">PROMPTS</span>
        </span>
      )}
    </div>
  );
}

/* Export standalone plus icon for reuse */
export function PlusIcon({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="0"
        y="0"
        width="40"
        height="40"
        rx="10"
        fill="url(#plusGradStandalone)"
      />
      <rect x="11" y="17.5" width="18" height="5" rx="2.5" fill="white" />
      <rect x="17.5" y="11" width="5" height="18" rx="2.5" fill="white" />
      <defs>
        <linearGradient
          id="plusGradStandalone"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ff8b3b" />
          <stop offset="1" stopColor="#ff5a1b" />
        </linearGradient>
      </defs>
    </svg>
  );
}
