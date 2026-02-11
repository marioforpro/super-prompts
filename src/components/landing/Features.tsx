const features = [
  {
    num: "01",
    name: "Visual Library",
    desc: "Every prompt has a thumbnail. Browse your collection as a cinematic grid — identify styles at a glance.",
  },
  {
    num: "02",
    name: "Save from URL",
    desc: "Paste a link from X, Instagram, YouTube, or LinkedIn. We extract the prompt, preview image, and model info automatically.",
  },
  {
    num: "03",
    name: "Screenshot OCR",
    desc: "Upload a screenshot and our AI reads the prompt text from the image. Works with Stories, tutorials, Discord — anything.",
  },
  {
    num: "04",
    name: "Trending Feed",
    desc: "Discover what's working right now across creative AI communities. Save trending prompts to your library in one click.",
  },
  {
    num: "05",
    name: "Chrome Extension",
    desc: "Highlight any prompt text on the web, right-click, save. Access your favorites from anywhere. Zero friction.",
  },
  {
    num: "06",
    name: "Smart Tags",
    desc: "Auto-detected model tags plus your own custom tags. Folders, filters, instant search. Find any prompt in seconds.",
  },
];

export default function Features() {
  return (
    <section className="px-8 py-24 max-w-[68rem] mx-auto">
      <div
        className="font-display text-xs font-bold tracking-[0.15em] uppercase text-brand-400 mb-4"
      >
        Why Super Prompts
      </div>
      <h2
        className="font-display font-extrabold leading-tight mb-4 max-w-[30rem]"
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "-0.03em",
        }}
      >
        Every feature is designed around how creatives actually work.
      </h2>
      <p className="text-text-muted text-lg leading-relaxed max-w-[32rem] mb-14">
        Not another text file manager. A visual-first system built for people
        who think in images, motion, and sound.
      </p>

      {/* Editorial grid with 1px gap borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-surface-300 rounded-2xl overflow-hidden border border-surface-300">
        {features.map((feature) => (
          <div
            key={feature.num}
            className="group bg-surface-50 p-8 transition-all duration-400 relative overflow-hidden hover:bg-surface-100"
          >
            {/* Hover radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,107,43,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <div
              className="font-display text-[2.5rem] font-extrabold text-surface-300 mb-4 leading-none group-hover:text-brand-500/15 transition-colors duration-400"
            >
              {feature.num}
            </div>
            <div
              className="font-display text-lg font-bold text-foreground mb-2.5"
              style={{ letterSpacing: "-0.01em" }}
            >
              {feature.name}
            </div>
            <div className="text-sm leading-relaxed text-text-muted">
              {feature.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
