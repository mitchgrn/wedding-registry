"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export function ScrollHint() {
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const visibleRef = useRef(true);

  useEffect(() => {
    const target = document.getElementById("registry-section");

    if (!target) {
      return;
    }

    let frame = 0;

    const updateVisibility = () => {
      frame = 0;

      const viewportHeight = window.innerHeight;
      const targetTop = target.getBoundingClientRect().top;
      const hideThreshold = viewportHeight * 0.62;
      const showThreshold = viewportHeight * 0.76;
      const nextVisible = visibleRef.current ? targetTop > hideThreshold : targetTop > showThreshold;

      if (nextVisible !== visibleRef.current) {
        visibleRef.current = nextVisible;
        setVisible(nextVisible);
      }
    };

    const handleScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: "smooth" })}
      aria-label="Scroll to registry"
      initial={false}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              opacity: visible ? 1 : 0,
              y: visible ? 0 : -10,
              scale: visible ? 1 : 0.96,
            }
      }
      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      className={`mt-5 mb-2 flex flex-col items-center gap-1.5 transition-[pointer-events] ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
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
