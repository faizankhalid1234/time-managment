"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { BarChart3, History, Play, Square } from "lucide-react";
import { TopNavbar } from "@/components/TopNavbar";
import { BrandLogo } from "@/components/BrandLogo";
import { usePkClock } from "@/lib/time";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const now = usePkClock();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <main className="ambient relative min-h-screen overflow-hidden">
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <div className="aurora-blob pointer-events-none absolute -left-16 top-10 h-80 w-80 rounded-full bg-teal-400/30" />
      <div
        className="aurora-blob pointer-events-none absolute -right-10 top-24 h-96 w-96 rounded-full bg-sky-300/30"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="aurora-blob pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-300/20"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-10 sm:px-8">
        <TopNavbar
          right={
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-[var(--bg-soft)] hover:text-main sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-ink rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          }
        />

        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl"
          >
            <div className="mb-5 flex justify-center">
              <BrandLogo size={64} />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-main sm:text-6xl md:text-7xl">
              Time Management
            </h1>

            <div className="hero-clock mt-8 sm:mt-10">
              <div className="flex items-baseline justify-center gap-1 font-display tabular-nums sm:gap-2">
                <span className="hero-digit">{now.hour}</span>
                <span className="hero-colon">:</span>
                <span className="hero-digit">{now.minute}</span>
                <span className="hero-colon">:</span>
                <span className="hero-digit hero-sec">{now.second}</span>
                <span className="hero-ampm">{now.dayPeriod}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-muted sm:text-base">
                {now.weekday ? `${now.weekday} · ${now.shortDate}` : "\u00a0"}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center rounded-full px-8 py-3.5 text-sm font-semibold text-white"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="glass inline-flex items-center rounded-full px-8 py-3.5 text-sm font-semibold text-main"
              >
                Log in
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            <Feature icon={<Play className="h-5 w-5" />} label="Start" />
            <Feature icon={<Square className="h-5 w-5" />} label="End" />
            <Feature icon={<History className="h-5 w-5" />} label="History" />
            <Feature icon={<BarChart3 className="h-5 w-5" />} label="Graph" />
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="glass group rounded-[1.4rem] px-4 py-5 transition hover:-translate-y-1">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] transition group-hover:scale-110">
        {icon}
      </div>
      <p className="font-display text-base font-semibold text-main">{label}</p>
    </div>
  );
}
