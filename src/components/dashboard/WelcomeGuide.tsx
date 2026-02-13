"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface WelcomeGuideProps {
  onCreatePrompt: () => void;
}

const STORAGE_KEY = "sp-welcome-dismissed";

const steps = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    title: "Save & organize your prompts",
    desc: "Capture your best AI prompts in one place. Add images, tag them by topic, and sort by model or folder — so you never lose a great idea.",
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Smart AI text detection",
    desc: "Upload screenshots of conversations — Super Prompts auto-detects and extracts the text using AI vision, turning any image into a reusable prompt.",
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
      </svg>
    ),
    title: "Your creative library",
    desc: "Use folders, models, and tags to build a searchable library of prompts. Find exactly what you need in seconds, every time.",
  },
];

export default function WelcomeGuide({ onCreatePrompt }: WelcomeGuideProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    setStep(0);
    setDirection("next");
    setIsAnimating(false);
    setVisible(true);
  }, []);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => show(), 600);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Listen for custom event from Topbar (no page reload needed)
  useEffect(() => {
    const handler = () => show();
    window.addEventListener("show-welcome-guide", handler);
    return () => window.removeEventListener("show-welcome-guide", handler);
  }, [show]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const goToStep = useCallback(
    (target: number) => {
      if (isAnimating || target === step) return;
      setDirection(target > step ? "next" : "prev");
      setIsAnimating(true);
      // Brief delay so the exit animation plays, then switch
      setTimeout(() => {
        setStep(target);
        setIsAnimating(false);
      }, 200);
    },
    [step, isAnimating]
  );

  const handleGetStarted = () => {
    dismiss();
    onCreatePrompt();
  };

  if (!visible) return null;

  const animClass = isAnimating
    ? direction === "next"
      ? "translate-x-4 opacity-0"
      : "-translate-x-4 opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ animation: "fadeIn 0.25s ease-out" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div
        ref={containerRef}
        className="relative w-full max-w-sm mx-4 bg-surface-100 border border-surface-200 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        style={{ animation: "fadeUp 0.3s ease-out" }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-200/60 hover:bg-surface-200 text-text-dim hover:text-foreground transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon area */}
        <div className="pt-10 pb-4 flex items-center justify-center">
          <div
            className={`w-16 h-16 rounded-2xl bg-brand-400/10 border border-brand-400/20 flex items-center justify-center text-brand-400 transition-all duration-200 ease-out ${animClass}`}
          >
            {steps[step].icon}
          </div>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 pb-5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === step
                  ? "w-6 h-1.5 bg-brand-400"
                  : "w-1.5 h-1.5 bg-surface-300 hover:bg-surface-400"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Content — animated slide */}
        <div className="px-8 pb-2 text-center overflow-hidden">
          <div
            className={`transition-all duration-200 ease-out ${animClass}`}
          >
            <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">
              {steps[step].title}
            </h3>
            <p className="text-[13px] text-text-muted leading-relaxed">
              {steps[step].desc}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pt-5 pb-7">
          {step < steps.length - 1 ? (
            <div className="flex items-center gap-3">
              <button
                onClick={dismiss}
                className="flex-1 h-10 text-sm text-text-dim hover:text-text-muted hover:bg-surface-200 rounded-xl transition-colors cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={() => goToStep(step + 1)}
                className="flex-1 h-10 text-sm font-semibold text-white bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 rounded-xl shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          ) : (
            <button
              onClick={handleGetStarted}
              className="w-full h-10 text-sm font-semibold text-white bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 rounded-xl shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
            >
              Get started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
