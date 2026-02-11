import Hero from "@/components/landing/Hero";
import MockPreview from "@/components/landing/MockPreview";
import Features from "@/components/landing/Features";
import Workflow from "@/components/landing/Workflow";
import WaitlistForm from "@/components/landing/WaitlistForm";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <MockPreview />
      <Features />
      <Workflow />

      {/* Bottom CTA */}
      <section className="px-8 py-32 text-center relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,43,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <h2
            className="font-display font-extrabold mb-4"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
            }}
          >
            Ready to stop losing
            <br />
            your best work?
          </h2>
          <p className="text-text-muted text-lg max-w-md mx-auto mb-8 leading-relaxed">
            Join the early access list and be the first to organize your
            creative AI workflow.
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
