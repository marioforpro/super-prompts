import Hero from "@/components/landing/Hero";
import MockPreview from "@/components/landing/MockPreview";
import Workflow from "@/components/landing/Workflow";
import WaitlistForm from "@/components/landing/WaitlistForm";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <MockPreview />

      {/* Gradient divider */}
      <div className="gradient-divider max-w-3xl mx-auto" />

      <Workflow />

      {/* Gradient divider */}
      <div className="gradient-divider max-w-3xl mx-auto" />

      {/* Bottom CTA */}
      <section className="px-6 md:px-8 py-36 text-center relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,43,0.06) 0%, transparent 70%)",
          }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-sm font-bold tracking-[0.2em] uppercase text-brand-400 mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            Get Started
          </div>
          <h2
            className="font-display leading-[0.95] mb-6 tracking-[0.01em]"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            }}
          >
            READY TO ORGANIZE YOUR{" "}
            <span className="text-brand-400">CREATIVE PROMPTS</span>?
          </h2>
          <p className="text-text-muted text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            Join the waitlist and be the first to know when Super Prompts
            launches.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
