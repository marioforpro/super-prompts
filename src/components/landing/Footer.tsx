import Logo from "@/components/icons/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 px-6 md:px-8 py-12">
      <div className="max-w-[68rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <Logo size="md" />
        <div className="flex items-center gap-6">
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-dim text-base hover:text-brand-400 transition-colors"
          >
            X / Twitter
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-dim text-base hover:text-brand-400 transition-colors"
          >
            Instagram
          </a>
          <span className="text-surface-300">|</span>
          <p className="text-text-dim text-base">
            &copy; {new Date().getFullYear()} Super Prompts
          </p>
        </div>
      </div>
    </footer>
  );
}
