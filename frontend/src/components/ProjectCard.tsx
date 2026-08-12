"use client";

import { motion } from "framer-motion";
import { Play, Square, Trash2, Clock3 } from "lucide-react";
import type { Project } from "@/lib/api";
import { CountdownDisplay } from "./CountdownDisplay";
import { useEffect, useState } from "react";

type Props = {
  project: Project;
  onStart: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busy?: boolean;
};

export function ProjectCard({
  project,
  onStart,
  onStop,
  onDelete,
  busy,
}: Props) {
  const [elapsed, setElapsed] = useState(project.currentElapsed || 0);
  const running = project.status === "running";

  useEffect(() => {
    setElapsed(project.currentElapsed || 0);
  }, [project.currentElapsed, project.sessionStartedAt, project.status]);

  useEffect(() => {
    if (!running || !project.sessionStartedAt) return;
    const started = new Date(project.sessionStartedAt).getTime();
    const tick = () => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, project.sessionStartedAt]);

  const displaySeconds = running
    ? (project.totalSeconds || 0) + elapsed
    : project.liveSeconds || project.totalSeconds || 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`glass relative overflow-hidden rounded-[1.75rem] p-5 transition sm:p-6 ${
        running
          ? "ring-2 ring-[var(--ring)] shadow-[0_24px_55px_-28px_rgba(15,157,138,0.55)]"
          : "hover:-translate-y-0.5"
      }`}
    >
      {running && (
        <motion.div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3.2, repeat: Infinity }}
        />
      )}

      <div className="relative flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              {running && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
                </span>
              )}
              <h3 className="font-display text-xl text-main sm:text-2xl">
                {project.name}
              </h3>
            </div>
            {project.description ? (
              <p className="text-muted max-w-xl text-sm leading-relaxed">
                {project.description}
              </p>
            ) : (
              <p className="text-faint text-sm">No description</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(project.id)}
            disabled={busy || running}
            className="text-faint rounded-xl p-2 transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-40"
            aria-label="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="panel-soft rounded-2xl px-3 py-5 sm:px-4">
          <CountdownDisplay seconds={displaySeconds} running={running} />
          <p className="text-faint mt-3 flex items-center justify-center gap-1.5 text-xs">
            <Clock3 className="h-3.5 w-3.5" />
            {running
              ? `Started · ${project.sessionStartedPk || "Pakistan time"}`
              : project.lastSessionPk
                ? `Last session · ${project.lastSessionPk}`
                : `Created · ${project.createdAtPk}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!running ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={busy}
              onClick={() => onStart(project.id)}
              className="btn-primary group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current transition group-hover:scale-110" />
              Start
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={busy}
              onClick={() => onStop(project.id)}
              className="btn-ink group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5 fill-current transition group-hover:scale-110" />
              End
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
