"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { TopNavbar } from "@/components/TopNavbar";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="ambient min-h-screen" />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const { signup, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
        setError("This email is already registered. Please log in.");
      } else {
        setError(err instanceof Error ? err.message : "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ambient relative flex min-h-screen flex-col px-5 pb-12">
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <div className="aurora-blob pointer-events-none absolute left-[8%] top-32 h-64 w-64 rounded-full bg-sky-300/30" />

      <div className="relative mx-auto w-full max-w-6xl">
        <TopNavbar
          right={
            <Link
              href="/login"
              className="rounded-full bg-[var(--bg-soft)] px-4 py-2 text-sm font-semibold text-main ring-1 ring-[var(--border)] transition hover:bg-[var(--bg-elevated)]"
            >
              Log in
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
          <h1 className="font-display text-3xl text-main">Create account</h1>
          <p className="text-muted mt-2 text-sm">
            Your projects stay private — only you can see them.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-faint text-xs font-medium uppercase tracking-wider">
                Name
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
                placeholder="Your name"
              />
            </label>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                placeholder="At least 6 characters"
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
              {loading ? "Creating…" : "Sign up"}
            </button>
          </form>

          <p className="text-muted mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-accent font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
