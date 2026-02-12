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
      <div className="flex items-center gap-3 rounded-xl bg-brand-50 border border-brand-200 px-6 py-4">
        <svg
          className="w-5 h-5 text-brand-500 shrink-0"
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
        <p className="text-brand-600 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-lg">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        required
        className="flex-1 bg-white border border-surface-300 rounded-xl px-5 py-3.5 text-foreground text-base font-sans placeholder:text-text-dim outline-none transition-all duration-250 focus:border-brand-400 focus:shadow-[0_0_0_3px_rgba(217,119,87,0.12)]"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="group font-sans font-bold text-base tracking-wide px-8 py-3.5 rounded-xl border-none cursor-pointer text-white whitespace-nowrap transition-all duration-300 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
        style={{
          background: "linear-gradient(135deg, #e8956f 0%, #d97757 40%, #c46a4b 100%)",
          boxShadow: "0 4px 20px rgba(217,119,87,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(217,119,87,0.4), inset 0 1px 0 rgba(255,255,255,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(217,119,87,0.3), inset 0 1px 0 rgba(255,255,255,0.2)";
        }}
      >
        {status === "loading" ? (
          "Joining..."
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
              <rect x="6.5" y="1" width="3" height="14" rx="1.5" fill="white" />
              <rect x="1" y="6.5" width="14" height="3" rx="1.5" fill="white" />
            </svg>
            Get Early Access
          </>
        )}
      </button>
      {status === "error" && (
        <p className="text-red-500 text-sm mt-1 absolute -bottom-6 left-0">
          {message}
        </p>
      )}
    </form>
  );
}
