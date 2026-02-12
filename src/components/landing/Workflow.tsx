const steps = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    num: "Step 01",
    title: "Discover",
    desc: "Find prompts on social media, trending feed, or from colleagues' shared collections.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
    num: "Step 02",
    title: "Save",
    desc: "One-click capture via extension or URL paste. Preview images and metadata included.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    ),
    num: "Step 03",
    title: "Organize",
    desc: "Folders, tags, model filters. Your prompt library, structured exactly how you think.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-400">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    num: "Step 04",
    title: "Create",
    desc: "Copy, paste into your AI tool, generate. Iterate, save the improved version. Repeat.",
  },
];

export default function Workflow() {
  return (
    <section className="px-6 md:px-8 py-24 max-w-[68rem] mx-auto">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-brand-400 mb-4" style={{ fontFamily: "var(--font-mono)" }}>
        How It Works
      </div>
      <h2
        className="font-display leading-[0.95] mb-10 tracking-[0.01em]"
        style={{
          fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
        }}
      >
        FROM DISCOVERY TO CREATION IN FOUR STEPS
      </h2>

      <div className="flex flex-col md:flex-row border border-surface-300 rounded-2xl overflow-hidden">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`group flex-1 p-8 md:p-10 relative transition-all duration-300 hover:bg-surface-50 ${
              i < steps.length - 1
                ? "border-b md:border-b-0 md:border-r border-surface-300"
                : ""
            }`}
          >
            {/* Step number watermark */}
            <div className="absolute top-4 right-4 font-display text-[3rem] text-surface-300/30 leading-none select-none group-hover:text-brand-500/8 transition-colors duration-400">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="mb-4 opacity-70 group-hover:opacity-100 transition-opacity">{step.icon}</div>
            <div className="text-[0.7rem] font-bold tracking-widest text-brand-400 mb-2" style={{ fontFamily: "var(--font-mono)" }}>
              {step.num}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-text-muted">
              {step.desc}
            </p>
            {/* Arrow between steps on desktop */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-surface-400">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
