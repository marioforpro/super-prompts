import Logo from "@/components/icons/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 px-8 py-10">
      <div className="max-w-[68rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-text-dim text-sm">
          &copy; {new Date().getFullYear()} Super Prompts. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
