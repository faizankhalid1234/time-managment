"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PakistanClock } from "@/components/PakistanClock";
import { BrandLogo } from "@/components/BrandLogo";

type Props = {
  right?: ReactNode;
};

export function TopNavbar({ right }: Props) {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="sticky top-0 z-40 pt-3"
    >
      <nav className="nav-shell">
        <Link href="/" className="nav-brand group">
          <BrandLogo size={36} />
          <span className="nav-word">Time Management</span>
        </Link>

        <div className="nav-center">
          <PakistanClock />
        </div>

        <div className="nav-actions">
          <ThemeToggle />
          {right}
        </div>
      </nav>
    </motion.header>
  );
}
