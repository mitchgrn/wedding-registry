"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export function ScrollHint() {
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: "smooth" })}
      aria-label="Scroll to registry"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={
        prefersReducedMotion
          ? undefined
          : { opacity: visible ? 1 : 0, y: visible ? 0 : 4 }
      }
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`mt-5 mb-2 flex flex-col items-center gap-1 transition-opacity duration-500 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <span className="text-sm font-medium tracking-wide text-[var(--ink-black)]/40">
        Browse registry
      </span>
      <motion.div
        animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="text-[var(--ink-black)]/30"
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
