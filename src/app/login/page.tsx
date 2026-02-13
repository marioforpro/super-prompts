"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/icons/Logo";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const authError = searchParams.get("error");

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(232,118,75,0.08) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(80,100,180,0.06) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-[420px] anim-fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-8">
          <h1
            className="text-2xl font-bold tracking-wide text-center mb-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            WELCOME BACK
          </h1>
          <p className="text-text-muted text-sm text-center mb-8">
            Sign in to your creative prompt library
          </p>

          {/* Error messages */}
          {(error || authError) && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error || "Authentication failed. Please try again."}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-6"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="gradient-divider" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs text-text-dim uppercase tracking-widest">
              or
            </span>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5" style={{ fontFamily: "var(--font-mono)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface-100 border border-surface-300 rounded-lg px-4 py-3 text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5" style={{ fontFamily: "var(--font-mono)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full bg-surface-100 border border-surface-300 rounded-lg px-4 py-3 text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3.5 rounded-lg font-medium text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #e8764b, #d06840)",
                boxShadow: "0 4px 24px rgba(232, 118, 75, 0.25)",
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
          >
            Create one
          </Link>
        </p>

        {/* Back to home */}
        <p className="text-center text-xs text-text-dim mt-4">
          <Link href="/" className="hover:text-text-muted transition-colors">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
