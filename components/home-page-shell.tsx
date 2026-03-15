"use client";

import { CircleCheck, Gift, Heart } from "lucide-react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import heroPhoto from "@/app/images/us.jpg";
import { EmptyState } from "@/components/ui/empty-state";
import { RegistryBrowser } from "@/components/registry-browser";
import { ScrollHint } from "@/components/scroll-hint";
import type { RegistryItemWithStats } from "@/lib/types";

// Stripe-style easing: quick, precise, confident
const ease: [number, number, number, number] = [0.2, 0, 0, 1];

// Stagger helper — each index adds 60ms
const stagger = (i: number) => i * 0.06;

export function HomePageShell({
  items,
}: {
  items: RegistryItemWithStats[];
}) {
  const prefersReducedMotion = useReducedMotion();
  const availableCount = items.filter((item) => item.remaining_quantity > 0).length;
  const requestedCount = items.reduce((sum, item) => sum + item.reserved_quantity, 0);

  const fade = (i = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay: stagger(i), ease },
        };

  return (
    <main className="min-h-dvh bg-white">
      <header className="relative overflow-hidden border-b border-border">
        {/* Static, very light gradient — no animation */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fresh-sky/[0.04] via-white to-transparent"
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-5 pt-5 sm:px-6 md:pb-6 md:pt-10 xl:px-20">
          <motion.p
            {...fade(0)}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-cerulean"
          >
            Wedding Registry
          </motion.p>

          <motion.h1
            {...fade(1)}
            className="mt-2 text-center font-[family-name:var(--font-display)] text-[clamp(2.45rem,11vw,4rem)] italic leading-[0.98] tracking-[-0.01em] text-ink-black"
          >
            Taylor &amp; Mitch
          </motion.h1>

          <motion.div
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, scaleY: 0 },
              animate: { opacity: 1, scaleY: 1 },
              transition: { duration: 0.4, delay: stagger(2), ease },
            })}
            style={{ transformOrigin: "top" }}
            className="mt-4 h-6 w-px bg-gradient-to-b from-cerulean/20 to-fresh-sky/40 md:mt-5 md:h-7"
          />

          {/* Hero photo — static, no float */}
          <motion.div
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, scale: 0.98 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.5, delay: stagger(3), ease },
            })}
            className="relative mt-4 md:mt-5"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-1 border border-cerulean/15 sm:-inset-1.5 md:-inset-3"
            />
            <div className="relative h-[260px] w-[200px] overflow-hidden shadow-[0_8px_32px_rgba(0,23,31,0.12),0_2px_8px_rgba(0,52,89,0.08)] sm:h-[300px] sm:w-[226px] md:h-[400px] md:w-[300px]">
              <Image
                src={heroPhoto}
                alt="Taylor and Mitch"
                fill
                priority
                className="object-cover object-[center_18%]"
                sizes="(max-width: 640px) 200px, (max-width: 768px) 226px, 300px"
              />
            </div>
          </motion.div>

          <motion.p
            {...fade(4)}
            className="mt-4 text-center text-xs font-medium uppercase tracking-[0.24em] text-ink-black/50 sm:mt-5 sm:text-sm sm:tracking-[0.2em]"
          >
            Taylor &amp; Mitch, 2026
          </motion.p>

          <motion.div
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, scaleY: 0 },
              animate: { opacity: 1, scaleY: 1 },
              transition: { duration: 0.4, delay: stagger(5), ease },
            })}
            style={{ transformOrigin: "top" }}
            className="mt-3 h-6 w-px bg-gradient-to-b from-fresh-sky/40 to-cerulean/20 md:mt-4 md:h-7"
          />

          <motion.div
            {...fade(6)}
            className="mt-3 text-center md:mt-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cerulean sm:text-sm sm:tracking-[0.25em]">
              Wedding Shower
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-[1.4rem] text-ink-black sm:text-[1.6rem] md:text-[1.85rem]">
              May 3, 2026
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-black/70 sm:text-lg">
              1-3 pm ·{" "}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Red+River+Community+Centre"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-cerulean/35 underline-offset-4 transition hover:text-ink-black hover:decoration-cerulean"
              >
                Red River Community Centre
              </a>
            </p>
          </motion.div>

          <motion.p
            {...fade(7)}
            className="mt-4 max-w-md px-2 text-center text-base leading-relaxed text-ink-black/60 sm:px-0 sm:text-lg"
          >
            Browse the list, buy from the store, then mark what you&apos;re covering so everyone stays in the loop.
          </motion.p>

          <motion.div {...fade(8)}>
            <ScrollHint />
          </motion.div>
        </div>
      </header>

      <motion.div
        {...(prefersReducedMotion ? {} : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3, delay: stagger(9), ease },
        })}
        className="sticky top-0 z-40 border-b border-border bg-white/94 px-4 py-2.5 shadow-[0_4px_14px_rgba(0,23,31,0.04)] backdrop-blur-md sm:px-6 md:px-12 xl:px-20"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 overflow-x-auto pb-0.5 text-xs font-medium text-ink-black/70 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0 sm:text-sm">
          <div className="flex min-w-max items-center justify-center gap-1.5 px-0 py-1 sm:gap-2">
            <Gift size={14} className="text-cerulean sm:size-4" />
            <span>{items.length} {items.length === 1 ? "Item" : "Items"}</span>
          </div>
          <span aria-hidden="true" className="text-border/60">·</span>
          <div className="flex min-w-max items-center justify-center gap-1.5 px-0 py-1 sm:gap-2">
            <CircleCheck size={14} className="text-fresh-sky sm:size-4" />
            <span>{availableCount} Available</span>
          </div>
          {requestedCount > 0 ? (
            <>
              <span aria-hidden="true" className="text-border/60">·</span>
              <div className="flex min-w-max items-center justify-center gap-1.5 px-0 py-1 sm:gap-2">
                <Heart size={14} className="fill-deep-space-blue text-deep-space-blue sm:size-4" />
                <span>{requestedCount} Claimed</span>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>

      <motion.section
        id="registry-section"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={{ duration: 0.35, ease }}
        className="mx-auto max-w-5xl px-4 pb-4 pt-2 sm:px-6 sm:pb-8 md:px-12 md:pb-10 md:pt-8 xl:px-20"
      >
        {items.length ? (
          <RegistryBrowser items={items} />
        ) : (
          <EmptyState
            title="Registry items will appear here soon."
            description="Check back shortly for the full list."
          />
        )}
      </motion.section>

      <footer className="border-t bg-white px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
        <p className="mx-auto max-w-3xl text-center text-xs leading-5 text-muted-foreground">
          Built by Mitch, who rage quit every other wedding registry site and decided to just make his own.
        </p>
      </footer>
    </main>
  );
}
