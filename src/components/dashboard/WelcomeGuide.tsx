"use client";

import { useState, useEffect } from "react";

interface WelcomeGuideProps {
  onCreatePrompt: () => void;
}

const STORAGE_KEY = "sp-welcome-dismissed";

export default function WelcomeGuide({ onCreatePrompt }: WelcomeGuideProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so it feels intentional
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleGetStarted = () => {
    dismiss();
    onCreatePrompt();
  };

  if (!visible) return null;

  const steps = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      title: "Save your prompts",
      desc: "Add your AI prompts with images, tag them, and organize by model or folder.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
      title: "Smart AI detection",
      desc: "Upload screenshots — we auto-detect text and extract prompts using AI vision.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
      ),
      title: "Stay organized",
      desc: "Use folders, AI models, and tags to keep your creative library tidy and searchable.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div
        className="relative w-full max-w-md mx-4 bg-surface-100 border border-surface-200 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
        style={{ animation: "fadeUp 0.4s ease-out" }}
      >
        {/* Gradient header */}
        <div className="relative h-24 bg-gradient-to-br from-brand-400/20 to-brand-500/10 flex items-center justify-center">
          <div className="text-brand-400 opacity-80">
            {steps[step].icon}
          </div>
          {/* Step dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  i === step ? "bg-brand-400 w-4" : "bg-surface-300 hover:bg-surface-400"
                }`}
              />
            ))}
          </div>
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-surface-200/60 hover:bg-surface-200 text-text-dim hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            {steps[step].title}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            {steps[step].desc}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {step < steps.length - 1 ? (
              <>
                <button
                  onClick={dismiss}
                  className="flex-1 px-4 py-2.5 text-sm text-text-dim hover:text-text-muted hover:bg-surface-200 rounded-lg transition-colors cursor-pointer"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 rounded-lg shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
                >
                  Next
                </button>
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 rounded-lg shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
              >
                Create your first prompt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
