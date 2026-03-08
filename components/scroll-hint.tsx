"use client";

import { useEffect, useState } from "react";

export function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: "smooth" })}
      aria-label="Scroll to registry"
      className={`mt-5 mb-2 flex flex-col items-center gap-1 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <span className="text-sm font-medium tracking-wide text-[var(--ink-black)]/40">
        Browse gifts
      </span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="animate-bounce text-[var(--ink-black)]/30"
      >
        <path
          d="M4 7.5L10 13.5L16 7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
