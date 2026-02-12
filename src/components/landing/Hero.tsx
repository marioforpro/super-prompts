import Logo from "@/components/icons/Logo";
import WaitlistForm from "./WaitlistForm";
import BackgroundPattern from "./BackgroundPattern";

const models = [
  "Midjourney",
  "Runway",
  "Kling",
  "Nano Banana Pro",
  "Sora",
  "FLUX",
  "VEO",
  "Suno",
];

export default function Hero() {
  return (
    <>
      {/* Fixed Nav — Glass Morphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 glass border-b border-white/[0.06]">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-400 blink-dot" style={{ boxShadow: "0 0 8px rgba(232,118,75,0.5)" }} />
          <span className="text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full bg-brand-50 text-brand-300 border border-brand-200">
            Coming Soon
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="top"
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 pt-32 pb-16 overflow-hidden"
      >
        {/* Atmospheric gradient orbs — punchy */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Primary warm glow — top center, subtle */}
          <div
            className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[1100px] h-[700px]"
            style={{
              background: "radial-gradient(ellipse, rgba(232,118,75,0.08) 0%, rgba(232,118,75,0.03) 35%, transparent 65%)",
              animation: "orbFloat 20s ease-in-out infinite",
            }}
          />
          {/* Secondary cool glow — bottom left */}
          <div
            className="absolute bottom-[0%] left-[-10%] w-[600px] h-[600px]"
            style={{
              background: "radial-gradient(circle, rgba(80,120,200,0.04) 0%, transparent 60%)",
              animation: "orbFloat 25s ease-in-out infinite 5s",
            }}
          />
          {/* Accent warm glow — right side */}
          <div
            className="absolute top-[35%] right-[-10%] w-[500px] h-[500px]"
            style={{
              background: "radial-gradient(circle, rgba(232,118,75,0.05) 0%, transparent 60%)",
              animation: "orbFloat 18s ease-in-out infinite 3s",
            }}
          />
          {/* Film grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px 128px",
            }}
          />
          {/* Plus signs — only in hero intro */}
          <BackgroundPattern />
        </div>

        {/* Hero content */}
        <div className="max-w-[58rem] text-center relative z-10">
          {/* Badge */}
          <div className="anim-fade-up anim-d1 mb-10 inline-flex items-center gap-2 sm:gap-3 flex-wrap justify-center px-2">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <rect x="5.5" y="0" width="3" height="14" rx="1.5" fill="rgba(232,118,75,0.6)" />
              <rect x="0" y="5.5" width="14" height="3" rx="1.5" fill="rgba(232,118,75,0.6)" />
            </svg>
            <span
              className="text-sm sm:text-lg font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase text-brand-300"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Prompt management for creatives
            </span>
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <rect x="5.5" y="0" width="3" height="14" rx="1.5" fill="rgba(232,118,75,0.6)" />
              <rect x="0" y="5.5" width="14" height="3" rx="1.5" fill="rgba(232,118,75,0.6)" />
            </svg>
          </div>

          {/* Headline — DM Sans Bold, huge, with glowing coral accent */}
          <h1
            className="anim-fade-up anim-d2 font-extrabold leading-[0.93] mb-8 tracking-tight"
            style={{
              fontSize: "clamp(3rem, 9vw, 6.5rem)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span className="sm:whitespace-nowrap" style={{ color: "var(--color-foreground)" }}>NEVER LOSE A GREAT</span>
            <span className="sm:whitespace-nowrap">
              <span
                style={{
                  background: "linear-gradient(135deg, #f09070 0%, #e8764b 40%, #d06840 80%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmer 4s linear infinite",
                  filter: "drop-shadow(0 0 30px rgba(232,118,75,0.3))",
                }}
              >
                PROMPT
              </span>{" "}
              <span style={{ color: "var(--color-foreground)" }}>AGAIN</span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="anim-fade-up anim-d3 text-base sm:text-xl leading-relaxed text-text-muted mx-auto mb-12 max-w-xl px-2">
            Save, organize, and discover the best prompts for image, video, and sound generation.
          </p>

          {/* Model ticker — glass pills */}
          <div className="anim-fade-up anim-d3 flex flex-wrap justify-center gap-2 mb-12 px-2">
            {models.map((model) => (
              <span
                key={model}
                className="text-sm font-semibold tracking-wide px-4 py-1.5 rounded-full text-foreground/70 border border-white/[0.08] transition-all duration-300 hover:border-brand-400/40 hover:text-brand-300 hover:bg-brand-50 hover:scale-105"
                style={{ background: "rgba(17,17,22,0.5)" }}
              >
                {model}
              </span>
            ))}
            <span
              className="text-sm font-bold tracking-wide px-4 py-1.5 rounded-full text-brand-300 border border-brand-200"
              style={{ background: "rgba(232,118,75,0.06)" }}
            >
              +20 more
            </span>
          </div>

          {/* Waitlist */}
          <div className="anim-fade-up anim-d4 flex justify-center mb-4 px-2">
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
