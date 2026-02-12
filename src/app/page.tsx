import Hero from "@/components/landing/Hero";
import MockPreview from "@/components/landing/MockPreview";
import Workflow from "@/components/landing/Workflow";
import WaitlistForm from "@/components/landing/WaitlistForm";
import Footer from "@/components/landing/Footer";
export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <MockPreview />

      {/* Gradient divider */}
      <div className="gradient-divider max-w-3xl mx-auto" />

      <Workflow />

      {/* Gradient divider */}
      <div className="gradient-divider max-w-3xl mx-auto" />

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 md:px-8 py-24 sm:py-36 text-center relative overflow-hidden">
        {/* Atmospheric glow behind CTA */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px]"
          style={{
            background:
              "radial-gradient(circle, rgba(232,118,75,0.06) 0%, rgba(232,118,75,0.02) 40%, transparent 65%)",
          }}
        />

        <div className="relative z-10">
          <div className="text-sm font-bold tracking-[0.2em] uppercase text-brand-400 mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            Get Started
          </div>
          <h2
            className="font-extrabold leading-[1.05] mb-6 tracking-tight"
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            }}
          >
            READY TO ORGANIZE<br />
            YOUR{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #f09070 0%, #e8764b 50%, #d06840 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 20px rgba(232,118,75,0.25))",
              }}
            >
              CREATIVE PROMPTS
            </span>
            ?
          </h2>
          <p className="text-text-muted text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join the waitlist and be the first to know when Super Prompts launches.
          </p>
          <div className="flex justify-center px-2">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
