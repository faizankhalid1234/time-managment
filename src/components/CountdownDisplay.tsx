"use client";

import { motion } from "framer-motion";
import { formatCountdown } from "@/lib/time";

type Props = {
  seconds: number;
  running?: boolean;
  size?: "lg" | "md";
};

export function CountdownDisplay({ seconds, running, size = "lg" }: Props) {
  const { h, m, s } = formatCountdown(seconds);
  const digit =
    size === "lg" ? "text-4xl sm:text-5xl md:text-6xl" : "text-2xl sm:text-3xl";

  return (
    <div className="flex items-center justify-center gap-1.5 font-display tracking-tight tabular-nums sm:gap-2">
      <Digit value={h} className={digit} running={running} />
      <Colon running={running} />
      <Digit value={m} className={digit} running={running} />
      <Colon running={running} />
      <Digit value={s} className={digit} running={running} />
    </div>
  );
}

function Digit({
  value,
  className,
  running,
}: {
  value: string;
  className: string;
  running?: boolean;
}) {
  return (
    <motion.span
      key={value}
      initial={{ y: 8, opacity: 0.4 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`panel-soft inline-flex min-w-[1.35em] justify-center rounded-2xl px-2 py-1.5 text-main ${className} ${
        running ? "ring-1 ring-[var(--ring)]" : ""
      }`}
    >
      {value}
    </motion.span>
  );
}

function Colon({ running }: { running?: boolean }) {
  return (
    <motion.span
      animate={running ? { opacity: [1, 0.25, 1] } : { opacity: 0.7 }}
      transition={
        running ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}
      }
      className="font-display text-accent pb-1 text-3xl sm:text-4xl"
    >
      :
    </motion.span>
  );
}
