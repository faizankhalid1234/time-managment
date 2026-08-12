"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type TabItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

type Props = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  action?: ReactNode;
};

export function MenuBar({ tabs, active, onChange, action }: Props) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav className="glass relative inline-flex w-full overflow-x-auto rounded-[1.35rem] p-1.5 sm:w-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative z-10 inline-flex flex-1 items-center justify-center gap-2 rounded-[1.05rem] px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                isActive ? "text-white" : "text-muted hover:text-main"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="menubar-pill"
                  className="absolute inset-0 rounded-[1.05rem] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)]"
                  style={{ background: "var(--nav-pill)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {action}
    </div>
  );
}
