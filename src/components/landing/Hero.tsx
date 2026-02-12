import Logo from "@/components/icons/Logo";
import WaitlistForm from "./WaitlistForm";

const models = [
  "Midjourney",
  "Runway",
  "Kling",
  "Sora",
  "FLUX",
  "Pika",
  "Suno",
  "Udio",
];

export default function Hero() {
  return (
    <>
      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 bg-[rgba(8,8,10,0.85)] backdrop-blur-[20px] backdrop-saturate-150 border-b border-white/[0.04]">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          {/* Live blinking dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full bg-brand-400"
              style={{ animation: "blink-dot 1.5s ease-in-out infinite" }}
            />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-400" />
          </span>
          <span className="text-[0.7rem] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/15">
            Coming Soon
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="top"
        className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-8 pt-32 pb-16 overflow-hidden"
      >
        {/* Dot grid background texture */}
        <div className="absolute inset-0 dot-grid opacity-40" />

        {/* Atmospheric glow orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255, 107, 43, 0.08) 0%, transparent 70%)",
              animation: "pulseGlow 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-[30%] right-[5%] w-[400px] h-[400px]"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 139, 59, 0.04) 0%, transparent 70%)",
              animation: "pulseGlow 8s ease-in-out infinite 2s",
            }}
          />
          {/* Horizon line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255, 107, 43, 0.15), transparent)",
            }}
          />
        </div>

        {/* Hero content */}
        <div className="max-w-[60rem] text-center relative z-10">
          {/* Creative "Prompt Management for Creatives" badge */}
          <div className="anim-fade-up anim-d1 mb-10 inline-flex items-center gap-3">
            {/* Decorative plus */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-brand-400"
            >
              <rect
                x="5.5"
                y="0"
                width="3"
                height="14"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="0"
                y="5.5"
                width="14"
                height="3"
                rx="1.5"
                fill="currentColor"
              />
            </svg>
            <span
              className="text-[0.7rem] font-bold tracking-[0.25em] uppercase text-brand-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Prompt management for creatives
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-brand-400"
            >
              <rect
                x="5.5"
                y="0"
                width="3"
                height="14"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="0"
                y="5.5"
                width="14"
                height="3"
                rx="1.5"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Headline — Bebas Neue, cinematic, horizontal */}
          <h1 className="anim-fade-up anim-d2 font-display leading-[0.95] mb-6 tracking-[0.02em]"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7.5rem)",
            }}
          >
            NEVER LOSE A GREAT{" "}
            <span
              className="inline-block"
              style={{
                background:
                  "linear-gradient(135deg, #ff8b3b 0%, #ffb347 50%, #ff6b2b 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 4s linear infinite",
              }}
            >
              PROMPT
            </span>{" "}
            AGAIN
          </h1>

          {/* Subheadline */}
          <p className="anim-fade-up anim-d3 text-lg leading-relaxed text-text-muted max-w-[36rem] mx-auto mb-10">
            The visual prompt library for creatives. Save prompts from anywhere,
            organize with previews, and discover what&apos;s trending — for
            image, video, and sound generation.
          </p>

          {/* Model ticker */}
          <div className="anim-fade-up anim-d3 flex flex-wrap justify-center gap-1.5 mb-10">
            {models.map((model) => (
              <span
                key={model}
                className="text-[0.7rem] font-semibold tracking-wide px-3 py-1 rounded-full bg-surface-100 text-text-dim border border-surface-300 transition-all duration-300 hover:border-brand-500 hover:text-brand-400 hover:bg-brand-500/5 hover:scale-105"
              >
                {model}
              </span>
            ))}
            <span className="text-[0.7rem] font-semibold tracking-wide px-3 py-1 rounded-full bg-brand-500/8 text-brand-400 border border-brand-500/20">
              +20 more
            </span>
          </div>

          {/* Waitlist */}
          <div className="anim-fade-up anim-d4 flex justify-center mb-4">
            <WaitlistForm />
          </div>
          <p className="anim-fade-up anim-d5 text-[0.8rem] text-text-dim">
            Join creatives on the waitlist. No spam, ever.
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-dim"
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
          <span className="text-[0.65rem] tracking-widest uppercase">
            Scroll
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>
    </>
  );
}
