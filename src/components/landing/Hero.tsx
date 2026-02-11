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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 bg-[rgba(8,8,10,0.8)] backdrop-blur-[20px] backdrop-saturate-150 border-b border-white/[0.04]">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          {/* Live pulse dot */}
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full bg-brand-400"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-400" />
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
          <div
            className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px]"
            style={{
              background:
                "radial-gradient(circle, rgba(229, 90, 27, 0.03) 0%, transparent 70%)",
              animation: "pulseGlow 7s ease-in-out infinite 4s",
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

        {/* Decorative corner marks */}
        <div className="absolute top-28 left-8 w-8 h-8 border-l border-t border-surface-300/40 hidden lg:block" />
        <div className="absolute top-28 right-8 w-8 h-8 border-r border-t border-surface-300/40 hidden lg:block" />

        {/* Hero content */}
        <div className="max-w-[52rem] text-center relative z-10">
          {/* Eyebrow */}
          <div className="anim-fade-up anim-d1 inline-flex items-center gap-2.5 text-[0.8rem] font-medium tracking-widest uppercase text-brand-400 mb-8">
            <span className="w-8 h-px bg-brand-500" />
            Prompt management for creatives
            <span className="w-8 h-px bg-brand-500" />
          </div>

          {/* Headline — original copy */}
          <h1
            className="anim-fade-up anim-d2 font-display font-extrabold leading-[1.05] mb-6"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              letterSpacing: "-0.04em",
            }}
          >
            Never lose a great
            <br />
            <span
              className="bg-clip-text"
              style={{
                background:
                  "linear-gradient(135deg, #ff8b3b 0%, #ffb347 50%, #ff6b2b 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 4s linear infinite",
              }}
            >
              prompt
            </span>{" "}
            again.
          </h1>

          {/* Subheadline — original copy */}
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
