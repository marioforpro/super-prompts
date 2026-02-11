"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-brand-500/10 border border-brand-500/30 px-6 py-4">
        <svg
          className="w-5 h-5 text-brand-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-brand-300 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5 w-full max-w-md">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        required
        className="flex-1 bg-surface-100 border border-surface-300 rounded-[10px] px-4 py-3 text-white text-sm font-sans placeholder:text-text-dim outline-none transition-all duration-250 focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(255,107,43,0.1),0_0_30px_rgba(255,107,43,0.05)]"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="font-display font-bold text-sm px-7 py-3 rounded-[10px] border-none cursor-pointer bg-brand-500 text-white whitespace-nowrap transition-all duration-250 shadow-[0_4px_20px_rgba(255,107,43,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-brand-600 hover:-translate-y-px hover:shadow-[0_6px_30px_rgba(255,107,43,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Joining..." : "Get Early Access"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-sm mt-1 absolute -bottom-6 left-0">
          {message}
        </p>
      )}
    </form>
  );
}
