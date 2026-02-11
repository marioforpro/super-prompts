import Logo from "@/components/icons/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-surface-300/30 px-6 py-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Super Prompts. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
