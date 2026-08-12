"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  FolderKanban,
  History,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  api,
  type Project,
  type Session,
  type WeeklyStats,
} from "@/lib/api";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { WeeklyChart } from "@/components/WeeklyChart";
import { TopNavbar } from "@/components/TopNavbar";
import { MenuBar } from "@/components/MenuBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { formatCountdown } from "@/lib/time";

type Tab = "projects" | "history" | "weekly";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const loadProjects = useCallback(async () => {
    const res = await api.projects();
    setProjects(res.projects);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.history();
      setSessions(res.sessions);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadWeekly = useCallback(async () => {
    setWeeklyLoading(true);
    try {
      const res = await api.weekly();
      setWeekly(res);
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadProjects()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, loadProjects]);

  useEffect(() => {
    if (!user) return;
    if (tab === "history") loadHistory().catch((err) => setError(err.message));
    if (tab === "weekly") loadWeekly().catch((err) => setError(err.message));
  }, [tab, user, loadHistory, loadWeekly]);

  async function handleCreate(name: string, description: string) {
    const res = await api.createProject({ name, description });
    setProjects((prev) => [res.project, ...prev]);
  }

  async function handleStart(id: string) {
    setBusyId(id);
    setError("");
    try {
      await api.start(id);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStop(id: string) {
    setBusyId(id);
    setError("");
    try {
      await api.stop(id);
      await loadProjects();
      if (tab === "history") await loadHistory();
      if (tab === "weekly") await loadWeekly();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    setBusyId(id);
    setError("");
    try {
      await api.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (authLoading || !user) {
    return (
      <div className="ambient flex min-h-screen items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  const totalTracked = projects.reduce(
    (sum, p) => sum + (p.liveSeconds || p.totalSeconds || 0),
    0
  );
  const activeCount = projects.filter((p) => p.status === "running").length;

  return (
    <main className="ambient relative min-h-screen">
      <div className="grid-fade pointer-events-none absolute inset-0 opacity-80" />
      <div className="aurora-blob pointer-events-none absolute left-[8%] top-24 h-56 w-56 rounded-full bg-teal-400/25" />
      <div
        className="aurora-blob pointer-events-none absolute right-[6%] top-40 h-64 w-64 rounded-full bg-sky-300/30"
        style={{ animationDelay: "1.4s" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <TopNavbar
          right={<ProfileMenu user={user} onLogout={handleLogout} />}
        />

        <section className="mb-6 mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Your projects" value={String(projects.length)} hint="Private to you" accent="teal" />
          <Stat label="Total tracked" value={formatCountdown(totalTracked).text} hint="All projects" accent="sky" />
          <Stat label="Active now" value={String(activeCount)} hint="Running timers" accent="coral" />
        </section>

        <MenuBar
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          tabs={[
            {
              id: "projects",
              label: "Projects",
              icon: <FolderKanban className="h-4 w-4" />,
            },
            {
              id: "history",
              label: "History",
              icon: <History className="h-4 w-4" />,
            },
            {
              id: "weekly",
              label: "Week graph",
              icon: <BarChart3 className="h-4 w-4" />,
            },
          ]}
          action={
            tab === "projects" ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                New project
              </motion.button>
            ) : undefined
          }
        />

        {error && (
          <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-100">
            {error}
          </p>
        )}

        {tab === "projects" && (
          <>
            {loading ? (
              <p className="py-16 text-center text-faint">Loading projects…</p>
            ) : projects.length === 0 ? (
              <EmptyProjects onCreate={() => setModalOpen(true)} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {projects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      busy={busyId === p.id}
                      onStart={handleStart}
                      onStop={handleStop}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {tab === "history" && (
          <div className="glass overflow-hidden rounded-[1.75rem]">
            {historyLoading ? (
              <p className="py-16 text-center text-faint">Loading history…</p>
            ) : sessions.length === 0 ? (
              <p className="py-16 text-center text-faint">
                No sessions yet. Start and end a timer to build history.
              </p>
            ) : (
              <div className="divide-y divide-ink/5">
                {sessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-2 px-5 py-4 transition hover:bg-[var(--bg-soft)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-display text-lg text-main">
                        {s.projectName}
                      </p>
                      <p className="text-xs text-faint">
                        {s.weekday} · {s.dateKey} · {s.startPk} → {s.endPk}
                      </p>
                    </div>
                    <p className="font-display text-xl tabular-nums text-accent">
                      {s.duration.formatted}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "weekly" && (
          <div className="glass rounded-[1.75rem] p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-main">This week</h2>
                <p className="text-sm text-muted">
                  Hours spent per project · Pakistan week (Mon–Sun)
                </p>
              </div>
              {weekly && (
                <p className="rounded-full bg-[var(--bg-soft)] px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-[var(--border)]">
                  Total {formatCountdown(weekly.totalSeconds).text}
                </p>
              )}
            </div>
            <WeeklyChart stats={weekly} loading={weeklyLoading} />

            {weekly && weekly.series.length > 0 && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {weekly.series
                  .slice()
                  .sort((a, b) => b.totalSeconds - a.totalSeconds)
                  .map((s) => (
                    <div
                      key={s.projectId}
                      className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3 ring-1 ring-[var(--border)]"
                    >
                      <span className="text-sm font-medium text-main">
                        {s.projectName}
                      </span>
                      <span className="font-display tabular-nums text-accent">
                        {s.duration.formatted}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: "teal" | "sky" | "coral";
}) {
  const dot =
    accent === "teal"
      ? "bg-[var(--accent-soft)]0"
      : accent === "sky"
        ? "bg-sky-400"
        : "bg-[var(--coral)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[1.5rem] px-5 py-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-xs font-medium uppercase tracking-wider text-faint">
          {label}
        </p>
      </div>
      <p className="font-display text-2xl text-main sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs text-faint">{hint}</p>
    </motion.div>
  );
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-[2rem] border-dashed px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
        <Plus className="h-6 w-6" />
      </div>
      <p className="font-display text-2xl text-main">Create your first project</p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Add a project, press Start to begin the countdown, then End to save the
        session to your history.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="btn-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        New project
      </button>
    </div>
  );
}
