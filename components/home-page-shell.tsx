"use client";

import { CircleCheck, Gift, Heart } from "lucide-react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import heroPhoto from "@/app/images/us.jpg";
import { EnvAlert } from "@/components/env-alert";
import { RegistryBrowser } from "@/components/registry-browser";
import { ScrollHint } from "@/components/scroll-hint";
import type { RegistryItemWithStats } from "@/lib/types";

// Stripe-style easing: quick, precise, confident
const ease: [number, number, number, number] = [0.2, 0, 0, 1];

// Stagger helper — each index adds 60ms
const stagger = (i: number) => i * 0.06;

export function HomePageShell({
  items,
  envReady,
}: {
  items: RegistryItemWithStats[];
  envReady: boolean;
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
    <main className="min-h-screen bg-white">
      <header className="relative overflow-hidden border-b border-[var(--border)]">
        {/* Static, very light gradient — no animation */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--fresh-sky)]/[0.04] via-white to-transparent"
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-4 pt-6 md:pb-6 md:pt-10 xl:px-20">
          <motion.p
            {...fade(0)}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cerulean)]"
          >
            Wedding Registry
          </motion.p>

          <motion.h1
            {...fade(1)}
            className="mt-2 text-center font-[family-name:var(--font-display)] text-[clamp(2.8rem,6vw,4rem)] italic leading-[1] tracking-[-0.01em] text-[var(--ink-black)]"
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
            className="mt-5 h-7 w-px bg-gradient-to-b from-[var(--cerulean)]/20 to-[var(--fresh-sky)]/40"
          />

          {/* Hero photo — static, no float */}
          <motion.div
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, scale: 0.98 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.5, delay: stagger(3), ease },
            })}
            className="relative mt-5"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-1.5 border border-[var(--cerulean)]/15 md:-inset-3"
            />
            <div className="relative h-[300px] w-[226px] overflow-hidden shadow-[0_8px_32px_rgba(0,23,31,0.12),0_2px_8px_rgba(0,52,89,0.08)] md:h-[400px] md:w-[300px]">
              <Image
                src={heroPhoto}
                alt="Taylor and Mitch"
                fill
                priority
                className="object-cover object-[center_18%]"
                sizes="(max-width: 768px) 226px, 300px"
              />
            </div>
          </motion.div>

          <motion.p
            {...fade(4)}
            className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-[var(--ink-black)]/50"
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
            className="mt-4 h-7 w-px bg-gradient-to-b from-[var(--fresh-sky)]/40 to-[var(--cerulean)]/20"
          />

          <motion.div
            {...fade(6)}
            className="mt-4 text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--cerulean)]">
              Wedding Shower
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-[1.6rem] text-[var(--ink-black)] md:text-[1.85rem]">
              May 3, 2026
            </p>
            <p className="mt-0.5 text-lg text-[var(--ink-black)]/70">
              1-3 pm ·{" "}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Red+River+Community+Centre"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[var(--cerulean)]/35 underline-offset-4 transition hover:text-[var(--ink-black)] hover:decoration-[var(--cerulean)]"
              >
                Red River Community Centre
              </a>
            </p>
          </motion.div>

          <motion.p
            {...fade(7)}
            className="mt-4 max-w-md text-center text-lg leading-relaxed text-[var(--ink-black)]/60"
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
        className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/94 px-6 py-3 shadow-[0_4px_14px_rgba(0,23,31,0.04)] backdrop-blur-md md:px-12 xl:px-20"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-6 text-sm font-medium text-[var(--ink-black)]/70">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-[var(--cerulean)]" />
            <span>{items.length} {items.length === 1 ? "Item" : "Items"}</span>
          </div>
          <span className="h-4 w-px bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <CircleCheck size={16} className="text-[var(--fresh-sky)]" />
            <span>{availableCount} Available</span>
          </div>
          {requestedCount > 0 ? (
            <>
              <span className="h-4 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-2">
                <Heart size={16} className="fill-[var(--deep-space-blue)] text-[var(--deep-space-blue)]" />
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
        className="mx-auto max-w-5xl px-6 py-10 md:px-12 md:py-12 xl:px-20"
      >
        {!envReady ? <EnvAlert /> : null}

        {items.length ? (
          <RegistryBrowser items={items} />
        ) : (
          <div className="rounded-lg border border-dashed border-[rgba(0,52,89,0.1)] bg-white p-16 text-center text-base text-muted-foreground">
            Add your first item from the admin screen once Supabase is configured.
          </div>
        )}
      </motion.section>

      <footer className="border-t bg-white px-6 py-5">
        <p className="text-center text-xs text-muted-foreground">
          Built by Mitch, who rage quit every other wedding registry site and decided to just make his own.
        </p>
      </footer>
    </main>
  );
}
