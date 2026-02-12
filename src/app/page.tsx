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
        {/* Soft warm background wash */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          style={{
            background:
              "radial-gradient(circle, rgba(217,119,87,0.06) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10">
          <div className="text-sm font-bold tracking-[0.2em] uppercase text-brand-500 mb-6" style={{ fontFamily: "var(--font-mono)" }}>
            Get Started
          </div>
          <h2
            className="font-display leading-[1] mb-6"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.8rem)",
            }}
          >
            Ready to Organize Your{" "}
            <span className="text-brand-400 italic">Creative Prompts</span>?
          </h2>
          <p className="text-text-muted text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join the waitlist and be the first to know when Super Prompts launches.
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
