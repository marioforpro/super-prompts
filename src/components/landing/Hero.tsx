import Logo from "@/components/icons/Logo";
import Badge from "@/components/ui/Badge";
import WaitlistForm from "./WaitlistForm";

export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 py-6">
        <Logo size="md" />
        <Badge variant="orange">Coming Soon</Badge>
      </nav>

      {/* Hero content */}
      <div className="max-w-3xl mx-auto text-center space-y-8">
        {/* Model badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {["Midjourney", "Runway", "Kling", "Sora", "FLUX", "Pika", "Suno"].map((model) => (
            <Badge key={model} variant="default">{model}</Badge>
          ))}
          <Badge variant="orange">+20 more</Badge>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          Never lose a great{" "}
          <span className="bg-gradient-to-r from-brand-400 to-amber-400 bg-clip-text text-transparent">
            prompt
          </span>{" "}
          again.
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          The visual prompt library for creatives. Save prompts from anywhere,
          organize with previews, and discover what&apos;s trending — for image,
          video, and sound generation.
        </p>

        {/* Waitlist form */}
        <div className="flex justify-center">
          <WaitlistForm />
        </div>

        {/* Social proof placeholder */}
        <p className="text-sm text-gray-600">
          Join creatives on the waitlist. No spam, ever.
        </p>
      </div>
    </section>
  );
}
