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
    title: "Never lose a great prompt again",
    desc: "Save your best prompts with images, tags, and notes. Organize by AI model or folder so every creative idea is one click away.",
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Screenshots in, prompts out",
    desc: "Just drop a screenshot. Our AI reads the text instantly and turns it into a clean, reusable prompt you can copy and use anywhere.",
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
      </svg>
    ),
    title: "Search 100 prompts in seconds",
    desc: "Folders, tags, favorites, and instant search. The more you save, the more powerful your library becomes. Built for creators who move fast.",
  },
];

export default function WelcomeGuide({ onCreatePrompt }: WelcomeGuideProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const animatingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    setStep(0);
    setDisplayStep(0);
    setPhase("idle");
    animatingRef.current = false;
    setVisible(true);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => show(), 600);
      return () => clearTimeout(timer);
    }
  }, [show]);

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
      if (animatingRef.current || target === step) return;
      animatingRef.current = true;

      // Phase 1: fade out current content
      setPhase("exit");

      // Phase 2: swap content and fade in
      setTimeout(() => {
        setStep(target);
        setDisplayStep(target);
        setPhase("enter");

        // Phase 3: settle
        setTimeout(() => {
          setPhase("idle");
          animatingRef.current = false;
        }, 250);
      }, 200);
    },
    [step]
  );

  const handleGetStarted = () => {
    dismiss();
    onCreatePrompt();
  };

  if (!visible) return null;

  const contentClass =
    phase === "exit"
      ? "opacity-0 scale-[0.97]"
      : phase === "enter"
        ? "opacity-0 scale-[0.97] animate-[guideSlideIn_0.25s_ease-out_forwards]"
        : "opacity-100 scale-100";

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes guideSlideIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes guideFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes guideCardUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ animation: "guideFadeIn 0.25s ease-out" }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

        {/* Card with side arrows */}
        <div className="relative flex items-center gap-3 mx-4 max-w-[460px] w-full">
          {/* Left arrow */}
          <button
            onClick={() => step > 0 && goToStep(step - 1)}
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
              step > 0
                ? "bg-surface-100/80 border border-surface-200 text-text-muted hover:bg-surface-200 hover:text-foreground"
                : "opacity-0 pointer-events-none"
            }`}
            aria-label="Previous step"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Main card */}
          <div
            ref={containerRef}
            className="relative flex-1 bg-surface-100 border border-surface-200 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            style={{ animation: "guideCardUp 0.35s ease-out" }}
          >
            {/* Top bar: step counter + close */}
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="text-xs font-medium text-text-dim tracking-wide">
                {step + 1}/{steps.length}
              </span>
              <button
                onClick={dismiss}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-200/60 hover:bg-surface-200 text-text-dim hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Animated content area — fixed height prevents layout shift */}
            <div className="px-8 pt-4 pb-2 text-center" style={{ minHeight: 210 }}>
              <div className={`transition-all duration-200 ease-out ${contentClass}`}>
                {/* Icon */}
                <div className="flex items-center justify-center pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-400/10 border border-brand-400/20 flex items-center justify-center text-brand-400">
                    {steps[displayStep].icon}
                  </div>
                </div>

                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 pb-5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToStep(i)}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        i === displayStep
                          ? "w-6 h-1.5 bg-brand-400"
                          : "w-1.5 h-1.5 bg-surface-300 hover:bg-surface-400"
                      }`}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Text */}
                <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">
                  {steps[displayStep].title}
                </h3>
                <p className="text-[13px] text-text-muted leading-relaxed">
                  {steps[displayStep].desc}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 pt-3 pb-7">
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

          {/* Right arrow */}
          <button
            onClick={() => step < steps.length - 1 && goToStep(step + 1)}
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
              step < steps.length - 1
                ? "bg-surface-100/80 border border-surface-200 text-text-muted hover:bg-surface-200 hover:text-foreground"
                : "opacity-0 pointer-events-none"
            }`}
            aria-label="Next step"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
