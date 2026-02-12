import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Placeholder — full dashboard coming next */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass rounded-2xl p-12 max-w-md text-center anim-fade-up">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(232, 118, 75, 0.1)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e8764b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-wide mb-2">YOU&apos;RE IN!</h1>
          <p className="text-text-muted text-sm mb-4">
            Welcome, <span className="text-brand-400">{user.email}</span>
          </p>
          <p className="text-text-dim text-xs">
            Dashboard is being built. The full prompt library is coming next.
          </p>
          <form action="/api/auth/signout" method="POST" className="mt-6">
            <button
              type="submit"
              className="text-sm text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
