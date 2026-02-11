const features = [
  {
    num: "01",
    name: "Visual-First Library",
    desc: "Every prompt has a face. Browse your collection as a beautiful grid of thumbnails — not a wall of text.",
  },
  {
    num: "02",
    name: "Save from Anywhere",
    desc: "Paste a URL from X, Instagram, YouTube, or LinkedIn. We extract the prompt, preview, and model automatically.",
  },
  {
    num: "03",
    name: "Screenshot OCR",
    desc: "Upload a screenshot of a prompt and our AI reads it for you. Works with Instagram Stories, tutorials, Discord — anything.",
  },
  {
    num: "04",
    name: "Trending Prompts",
    desc: "Discover what's working right now. A curated feed of the most effective prompts for image, video, and audio generation.",
  },
  {
    num: "05",
    name: "Chrome Extension",
    desc: "Highlight any prompt text on the web, right-click, and save it to your library. Zero friction capture.",
  },
  {
    num: "06",
    name: "Smart Organization",
    desc: "Folders, tags, and auto-detected AI models. Find any prompt instantly with powerful search and filters.",
  },
];

export default function Features() {
  return (
    <section className="px-6 md:px-8 py-24 max-w-[68rem] mx-auto relative">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <div className="relative z-10">
        <div className="font-display text-xs font-bold tracking-[0.15em] uppercase text-brand-400 mb-4">
          Features
        </div>
        <h2
          className="font-display font-extrabold leading-tight mb-4 max-w-[30rem]"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.03em",
          }}
        >
          Built for how creatives{" "}
          <span className="text-brand-400">actually work</span>
        </h2>
        <p className="text-text-muted text-lg leading-relaxed max-w-[32rem] mb-14">
          Not another text file manager. Super Prompts is designed for visual
          thinkers who need speed, beauty, and organization.
        </p>

        {/* Editorial grid with 1px gap borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-surface-300 rounded-2xl overflow-hidden border border-surface-300">
          {features.map((feature) => (
            <div
              key={feature.num}
              className="group bg-surface-50 p-8 transition-all duration-400 relative overflow-hidden hover:bg-surface-100"
            >
              {/* Hover radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,107,43,0.04),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              {/* Corner accent line on hover */}
              <div className="absolute top-0 left-0 w-0 h-[2px] bg-brand-500 group-hover:w-12 transition-all duration-500" />
              <div
                className="font-display text-[2.5rem] font-extrabold text-surface-300 mb-4 leading-none group-hover:text-brand-500/15 transition-colors duration-400"
              >
                {feature.num}
              </div>
              <div
                className="font-display text-lg font-bold text-foreground mb-2.5 relative z-10"
                style={{ letterSpacing: "-0.01em" }}
              >
                {feature.name}
              </div>
              <div className="text-sm leading-relaxed text-text-muted relative z-10">
                {feature.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
