"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { TopNavbar } from "@/components/TopNavbar";
import { SignupNeededModal } from "@/components/SignupNeededModal";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needSignup, setNeedSignup] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.code === "NO_ACCOUNT") {
        setNeedSignup(true);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ambient relative flex min-h-screen flex-col px-5 pb-12">
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <div className="aurora-blob pointer-events-none absolute right-[10%] top-28 h-64 w-64 rounded-full bg-teal-400/25" />

      <div className="relative mx-auto w-full max-w-6xl">
        <TopNavbar
          right={
            <Link
              href="/signup"
              className="btn-ink rounded-full px-4 py-2 text-sm font-semibold text-white"
            >
              Sign up
            </Link>
          }
        />
      </div>

      <div className="relative flex flex-1 items-center justify-center pt-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong w-full max-w-md rounded-[2rem] p-7 sm:p-8"
        >
          <h1 className="font-display text-3xl text-main">Welcome back</h1>
          <p className="text-muted mt-2 text-sm">
            Log in to continue tracking your private projects.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-faint text-xs font-medium uppercase tracking-wider">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="you@email.com"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-faint text-xs font-medium uppercase tracking-wider">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="text-muted mt-6 text-center text-sm">
            New here?{" "}
            <Link
              href="/signup"
              className="text-accent font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      <SignupNeededModal
        open={needSignup}
        email={email.trim()}
        onClose={() => setNeedSignup(false)}
      />
    </main>
  );
}
