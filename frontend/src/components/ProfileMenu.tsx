"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { User } from "@/lib/api";

type Props = {
  user: User;
  onLogout: () => void;
};

export function ProfileMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const letter = (user.email || user.name || "U").charAt(0).toUpperCase();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[220px] items-center gap-2 rounded-full bg-[var(--bg-soft)] py-1 pl-1 pr-3 ring-1 ring-[var(--border)] transition hover:ring-[var(--accent)]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-[11px] font-bold text-white">
          {letter}
        </span>
        <span className="hidden truncate text-left text-xs font-semibold text-main sm:block">
          {user.email}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="menu"
            className="glass-strong absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl p-2"
          >
            <div className="px-3 py-2.5">
              <p className="text-faint text-[10px] font-semibold uppercase tracking-wider">
                Logged in as
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-main">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
