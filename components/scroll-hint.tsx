"use client";

import { motion, useReducedMotion } from "motion/react";

export function ScrollHint() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: "smooth" })}
      aria-label="Scroll to registry"
      initial={false}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      className="mb-2 mt-5 flex flex-col items-center gap-1.5"
    >
      <span className="text-sm font-medium text-[var(--ink-black)]/40">
        Browse registry
      </span>
      <motion.div
        aria-hidden="true"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                y: [0, 6, 0],
                opacity: [0.35, 0.75, 0.35],
              }
        }
        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="text-[var(--ink-black)]/40"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 7.5L10 13.5L16 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.button>
  );
}
