const steps = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500">
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500">
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500">
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500">
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
    <section className="px-6 md:px-8 py-28 max-w-[68rem] mx-auto text-center">
      <div className="text-sm font-bold tracking-[0.2em] uppercase text-brand-500 mb-4" style={{ fontFamily: "var(--font-mono)" }}>
        How It Works
      </div>
      <h2
        className="font-display leading-[1] mb-16"
        style={{
          fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
        }}
      >
        Four Simple Steps
      </h2>

      {/* Timeline-style horizontal layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-[2.75rem] left-[10%] right-[10%] h-px bg-surface-300" />

        {steps.map((step, i) => (
          <div
            key={step.num}
            className="group relative flex flex-col items-center text-center px-6 py-6 md:py-0"
          >
            {/* Circle with icon */}
            <div className="relative z-10 w-[5.5rem] h-[5.5rem] rounded-full bg-white border border-surface-200 flex items-center justify-center mb-6 group-hover:border-brand-300 transition-all duration-300"
              style={{ boxShadow: "0 2px 8px rgba(42,37,34,0.05)" }}
            >
              {step.icon}
            </div>

            {/* Step number */}
            <div
              className="text-xs font-bold tracking-widest text-brand-400 mb-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {step.num}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-foreground mb-2.5">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-base leading-relaxed text-text-muted max-w-[200px]">
              {step.desc}
            </p>

            {/* Arrow between steps (mobile only) */}
            {i < steps.length - 1 && (
              <div className="md:hidden flex justify-center my-3 text-surface-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
