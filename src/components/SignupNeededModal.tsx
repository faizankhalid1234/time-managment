"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

type Props = {
  open: boolean;
  email?: string;
  onClose: () => void;
};

export function SignupNeededModal({ open, email, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 36, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-md overflow-hidden rounded-[1.85rem] p-7 text-center sm:p-8"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-teal-400/25 blur-3xl" />
            <button
              type="button"
              onClick={onClose}
              className="text-muted absolute right-4 top-4 rounded-full p-2 hover:bg-[var(--bg-soft)] hover:text-main"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <Sparkles className="h-6 w-6" />
            </div>

            <h2 className="font-display text-2xl text-main sm:text-3xl">
              Sign up first
            </h2>
            <p className="text-muted mt-3 text-sm leading-relaxed">
              {email ? (
                <>
                  <span className="font-semibold text-main">{email}</span> is
                  not registered yet. Create an account, then you can log in
                  anytime.
                </>
              ) : (
                <>
                  This email is not registered yet. Create an account first,
                  then log in.
                </>
              )}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href={
                  email
                    ? `/signup?email=${encodeURIComponent(email)}`
                    : "/signup"
                }
                className="btn-primary rounded-2xl py-3.5 text-sm font-semibold text-white"
              >
                Create account
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-[var(--bg-soft)] py-3 text-sm font-semibold text-main"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
