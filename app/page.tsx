import { Gift, CircleCheck, Heart } from "lucide-react";
import Image from "next/image";
import { EnvAlert } from "@/components/env-alert";
import { RegistryBrowser } from "@/components/registry-browser";
import { ScrollHint } from "@/components/scroll-hint";
import heroPhoto from "@/app/images/us.jpg";
import { getPublicRegistryItems } from "@/lib/data";
import { hasClientEnv, serverEnv } from "@/lib/env";

export default async function HomePage() {
  const items = hasClientEnv() && serverEnv.success ? await getPublicRegistryItems() : [];
  const availableCount = items.filter((item) => item.remaining_quantity > 0).length;
  const requestedCount = items.reduce((sum, item) => sum + item.reserved_quantity, 0);

  return (
    <main className="min-h-screen bg-white">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-[var(--border)]">
        {/* Background wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--fresh-sky)]/[0.06] via-white to-[var(--cerulean)]/[0.04]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-4 pt-6 md:pb-6 md:pt-10 xl:px-20">
          {/* Eyebrow */}
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cerulean)]">
            Wedding Registry
          </p>
          {/* Names */}
          <h1 className="mt-2 text-center font-[family-name:var(--font-display)] text-[clamp(2.8rem,6vw,4rem)] italic leading-[1] tracking-[-0.01em] text-[var(--ink-black)]">
            Taylor &amp; Mitch
          </h1>
          {/* Rule */}
          <div className="mt-5 h-7 w-px bg-gradient-to-b from-[var(--cerulean)]/20 to-[var(--fresh-sky)]/40" />
          {/* Framed photo */}
          <div className="relative mt-5">
            <div className="absolute -inset-1.5 border border-[var(--cerulean)]/20 md:-inset-3" />
            <div className="relative h-[300px] w-[226px] overflow-hidden shadow-[0_12px_48px_rgba(0,23,31,0.16),0_4px_16px_rgba(0,52,89,0.1)] md:h-[400px] md:w-[300px]">
              <Image src={heroPhoto} alt="Taylor and Mitch" fill priority
                className="object-cover object-[center_18%]"
                sizes="(max-width: 768px) 226px, 300px" />
            </div>
          </div>
          {/* Caption */}
          <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-[var(--ink-black)]/50">
            Taylor &amp; Mitch, 2026
          </p>
          {/* Rule */}
          <div className="mt-4 h-7 w-px bg-gradient-to-b from-[var(--fresh-sky)]/40 to-[var(--cerulean)]/20" />
          {/* Event details */}
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--cerulean)]">
              Wedding Shower
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-[1.6rem] text-[var(--ink-black)] md:text-[1.85rem]">
              May 3, 2026
            </p>
            <p className="mt-0.5 text-lg text-[var(--ink-black)]/70">
              1–3 pm · Red River Community Centre
            </p>
          </div>
          {/* Instructions */}
          <p className="mt-4 max-w-md text-center text-lg leading-relaxed text-[var(--ink-black)]/60">
            Browse the list, buy from the store, then mark what you&apos;re covering so everyone stays in the loop.
          </p>
          {/* Scroll hint */}
          <ScrollHint />
        </div>
      </header>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur-sm px-6 py-3 md:px-12 xl:px-20">
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
          {requestedCount > 0 && (
            <>
              <span className="h-4 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-2">
                <Heart size={16} className="fill-[var(--deep-space-blue)] text-[var(--deep-space-blue)]" />
                <span>{requestedCount} Claimed</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Registry ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-10 md:px-12 md:py-12 xl:px-20">
        {!hasClientEnv() || !serverEnv.success ? <EnvAlert /> : null}

        {items.length ? (
          <RegistryBrowser items={items} />
        ) : (
          <div className="card-elevated rounded-lg border-dashed p-16 text-center text-base text-muted-foreground">
            Add your first item from the admin screen once Supabase is configured.
          </div>
        )}
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-white px-6 py-5">
        <p className="text-center text-xs text-muted-foreground">
          Built by Mitch, who rage-quit every other wedding registry site and decided to just make his own.
        </p>
      </footer>

    </main>
  );
}
