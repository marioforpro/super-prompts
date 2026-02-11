const steps = [
  {
    icon: "\u{1F50D}",
    num: "Step 01",
    title: "Discover",
    desc: "Find prompts on social media, trending feed, or from colleagues' shared collections.",
  },
  {
    icon: "\u{1F4BE}",
    num: "Step 02",
    title: "Save",
    desc: "One-click capture via extension or URL paste. Preview images and metadata included.",
  },
  {
    icon: "\u{1F3AF}",
    num: "Step 03",
    title: "Organize",
    desc: "Folders, tags, model filters. Your prompt library, structured exactly how you think.",
  },
  {
    icon: "\u{1F680}",
    num: "Step 04",
    title: "Create",
    desc: "Copy, paste into your AI tool, generate. Iterate, save the improved version. Repeat.",
  },
];

export default function Workflow() {
  return (
    <section className="px-8 py-24 max-w-[68rem] mx-auto">
      <div className="font-display text-xs font-bold tracking-[0.15em] uppercase text-brand-400 mb-4">
        The Loop
      </div>
      <h2
        className="font-display font-extrabold leading-tight mb-10 max-w-[30rem]"
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "-0.03em",
        }}
      >
        From discovery to production in four steps.
      </h2>

      <div className="flex flex-col md:flex-row border border-surface-300 rounded-2xl overflow-hidden">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`flex-1 p-8 md:p-10 relative transition-all duration-300 hover:bg-surface-50 ${
              i < steps.length - 1
                ? "border-b md:border-b-0 md:border-r border-surface-300"
                : ""
            }`}
          >
            <div className="text-3xl mb-4">{step.icon}</div>
            <div className="font-display text-[0.7rem] font-bold tracking-widest text-brand-400 mb-2">
              {step.num}
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-2">
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
