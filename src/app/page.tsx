import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface">
      <Hero />
      <Features />

      {/* CTA repeat */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Ready to organize your{" "}
          <span className="text-brand-400">creative prompts</span>?
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Join the waitlist and be the first to know when Super Prompts launches.
        </p>
        <div className="flex justify-center">
          <a
            href="#top"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg px-8 py-3.5 transition-all duration-200 shadow-lg shadow-brand-500/25"
          >
            Join the Waitlist
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
              />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
