const steps = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    num: "01",
    title: "Discover",
    desc: "Find prompts on social media or trending feeds.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
    num: "02",
    title: "Save",
    desc: "One-click capture via extension or URL paste.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    ),
    num: "03",
    title: "Organize",
    desc: "Folders, tags, and filters. Your way.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    num: "04",
    title: "Create",
    desc: "Paste into your AI tool. Generate. Iterate.",
  },
];

export default function Workflow() {
  return (
    <section className="px-4 sm:px-6 md:px-8 py-10 sm:py-20 md:py-28 max-w-[68rem] mx-auto text-center">
      <div className="text-sm font-bold tracking-[0.2em] uppercase text-brand-400 mb-3 sm:mb-4" style={{ fontFamily: "var(--font-mono)" }}>
        How It Works
      </div>
      <h2
        className="font-extrabold leading-[1] mb-8 sm:mb-16 tracking-tight"
        style={{
          fontSize: "clamp(1.75rem, 5vw, 4.2rem)",
        }}
      >
        FOUR SIMPLE STEPS
      </h2>

      {/* Grid of 4: 2×2 on mobile/tablet, 1×4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 relative">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-[2.25rem] left-[10%] right-[10%] h-px bg-surface-300" />

        {steps.map((step) => (
          <div
            key={step.num}
            className="group relative flex flex-col items-center text-center px-2 py-3 sm:px-6 sm:py-6 md:py-0"
          >
            {/* Circle with icon — smaller on mobile */}
            <div
              className="relative z-10 w-14 h-14 sm:w-[5.5rem] sm:h-[5.5rem] rounded-full flex items-center justify-center mb-3 sm:mb-6 transition-all duration-300"
              style={{
                background: "rgba(17,17,22,0.8)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
            >
              <span className="scale-90 sm:scale-100">{step.icon}</span>
            </div>

            {/* Step number */}
            <div
              className="text-xs font-bold tracking-widest text-brand-400 mb-1.5 sm:mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {step.num}
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 sm:mb-2.5">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-sm sm:text-base leading-relaxed text-text-muted max-w-[200px]">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
