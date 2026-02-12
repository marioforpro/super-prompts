import Logo from "@/components/icons/Logo";
import WaitlistForm from "./WaitlistForm";

const models = [
  "Midjourney",
  "Runway",
  "Kling",
  "Sora",
  "FLUX",
  "VEO",
  "Suno",
  "Nano Banana Pro",
];

export default function Hero() {
  return (
    <>
      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 bg-[rgba(250,247,242,0.9)] backdrop-blur-[20px] backdrop-saturate-150 border-b border-surface-300/50">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-400 blink-dot" />
          <span className="text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
            Coming Soon
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="top"
        className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-8 pt-32 pb-16 overflow-hidden"
      >
        {/* Warm atmospheric glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute top-[0%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px]"
            style={{
              background: "radial-gradient(ellipse, rgba(232,118,75,0.07) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute bottom-[15%] left-[10%] w-[400px] h-[400px]"
            style={{
              background: "radial-gradient(circle, rgba(245,160,122,0.05) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Decorative plus signs — warm & confident */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="absolute top-[18%] left-[6%] text-brand-400/20" style={{ animation: "float 8s ease-in-out infinite" }}>
            <rect x="8" y="0" width="4" height="20" rx="2" fill="currentColor" />
            <rect x="0" y="8" width="20" height="4" rx="2" fill="currentColor" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="absolute top-[35%] right-[5%] text-brand-300/20" style={{ animation: "float 11s ease-in-out infinite 1.5s" }}>
            <rect x="8" y="0" width="4" height="20" rx="2" fill="currentColor" />
            <rect x="0" y="8" width="20" height="4" rx="2" fill="currentColor" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="absolute top-[68%] left-[4%] text-brand-300/15" style={{ animation: "float 13s ease-in-out infinite 2.5s" }}>
            <rect x="8" y="0" width="4" height="20" rx="2" fill="currentColor" />
            <rect x="0" y="8" width="20" height="4" rx="2" fill="currentColor" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="absolute top-[72%] right-[8%] text-brand-400/15" style={{ animation: "float 9s ease-in-out infinite 3.5s" }}>
            <rect x="8" y="0" width="4" height="20" rx="2" fill="currentColor" />
            <rect x="0" y="8" width="20" height="4" rx="2" fill="currentColor" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="max-w-[58rem] text-center relative z-10">
          {/* Badge — bold and proud */}
          <div className="anim-fade-up anim-d1 mb-10 inline-flex items-center gap-3">
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="text-brand-400">
              <rect x="5.5" y="0" width="3" height="14" rx="1.5" fill="currentColor" />
              <rect x="0" y="5.5" width="14" height="3" rx="1.5" fill="currentColor" />
            </svg>
            <span
              className="text-sm font-bold tracking-[0.25em] uppercase text-brand-600"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Prompt management for creatives
            </span>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" className="text-brand-400">
              <rect x="5.5" y="0" width="3" height="14" rx="1.5" fill="currentColor" />
              <rect x="0" y="5.5" width="14" height="3" rx="1.5" fill="currentColor" />
            </svg>
          </div>

          {/* Headline — Instrument Serif, confident, with vivid accent */}
          <h1
            className="anim-fade-up anim-d2 font-display leading-[0.98] mb-8"
            style={{ fontSize: "clamp(3.4rem, 10vw, 7.5rem)" }}
          >
            Never Lose a Great{" "}
            <span
              className="italic"
              style={{
                background: "linear-gradient(135deg, #e8764b 0%, #f5a07a 40%, #d4663e 80%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 4s linear infinite",
              }}
            >
              Prompt
            </span>{" "}
            Again
          </h1>

          {/* Subheadline */}
          <p className="anim-fade-up anim-d3 text-xl leading-relaxed text-text-muted mx-auto mb-12 whitespace-nowrap">
            Save, organize, and discover the best prompts for image, video, and sound generation.
          </p>

          {/* Model ticker */}
          <div className="anim-fade-up anim-d3 flex flex-wrap justify-center gap-2 mb-12">
            {models.map((model) => (
              <span
                key={model}
                className="text-sm font-semibold tracking-wide px-4 py-1.5 rounded-full bg-white text-foreground/70 border border-surface-300 transition-all duration-300 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 hover:scale-105"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                {model}
              </span>
            ))}
            <span className="text-sm font-bold tracking-wide px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
              +20 more
            </span>
          </div>

          {/* Waitlist */}
          <div className="anim-fade-up anim-d4 flex justify-center mb-4">
            <WaitlistForm />
          </div>
          <p className="anim-fade-up anim-d5 text-sm text-text-dim mt-1">
            Join creatives on the waitlist. No spam, ever.
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-dim"
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
          <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>
    </>
  );
}
