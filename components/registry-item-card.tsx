"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Gift, Sparkles, Tag } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ReservationForm } from "@/components/reservation-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  celebrationExitMs,
  celebrationVisibleMs,
  clearReservationCelebration,
  confettiPieces,
  hasRecentReservationCelebration,
} from "@/lib/reservation-celebration";
import { formatCurrency, getStoreLabel } from "@/lib/utils";
import type { RegistryItemWithStats } from "@/lib/types";

type ConfettiStyle = CSSProperties & {
  "--confetti-left": string;
  "--confetti-drift": string;
  "--confetti-rotate": string;
  "--confetti-delay": string;
  "--confetti-duration": string;
  "--confetti-color": string;
};

export function RegistryItemCard({
  item,
  viewMode = "grid",
}: {
  item: RegistryItemWithStats;
  viewMode?: "list" | "grid";
}) {
  const prefersReducedMotion = useReducedMotion();
  const rawPrice =
    item.display_price ??
    formatCurrency(item.manual_price, item.price_currency ?? "CAD") ??
    formatCurrency(item.price_amount, item.price_currency ?? "CAD");
  // Keep $ and number, strip currency code/label (e.g. "CA$49.99" → "$49.99")
  const displayPrice = rawPrice?.replace(/[A-Z]{2,3}\$/, "$").replace(/\s?[A-Z]{2,3}$/, "") ?? null;

  const reservedPct =
    item.desired_quantity > 0
      ? Math.min(100, Math.round((item.reserved_quantity / item.desired_quantity) * 100))
      : 0;

  const fullyReserved = item.remaining_quantity <= 0;
  const storeLabel = getStoreLabel(item.purchase_url);
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [celebrationPhase, setCelebrationPhase] = useState<"idle" | "visible" | "exiting">("idle");
  const showRecentCelebration = celebrationPhase !== "idle";

  useEffect(() => {
    if (!fullyReserved || !hasRecentReservationCelebration(item.id)) {
      return;
    }

    setCelebrationPhase("visible");
    setCelebrationCount((count) => count + 1);
  }, [fullyReserved, item.id]);

  useEffect(() => {
    if (celebrationPhase !== "visible") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCelebrationPhase("exiting");
    }, celebrationVisibleMs);

    return () => window.clearTimeout(timeoutId);
  }, [celebrationCount, celebrationPhase]);

  useEffect(() => {
    if (celebrationPhase !== "exiting") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearReservationCelebration(item.id);
      setCelebrationPhase("idle");
    }, celebrationExitMs);

    return () => window.clearTimeout(timeoutId);
  }, [celebrationPhase, item.id]);

  return (
    <motion.article
      initial={false}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
      whileHover={undefined}
      className={[
        "group overflow-hidden rounded-[1.4rem] border border-[rgba(0,52,89,0.1)] bg-white shadow-[0_1px_4px_rgba(0,23,31,0.05)] transition-[box-shadow,border-color] duration-[180ms]",
        fullyReserved
          ? "border-[var(--deep-space-blue)]/12 bg-[linear-gradient(180deg,rgba(248,251,253,0.98),rgba(238,245,249,0.92))] hover:border-[var(--deep-space-blue)]/20"
          : "hover:border-[var(--cerulean)]/20 hover:shadow-[0_4px_16px_rgba(0,23,31,0.09),0_1px_4px_rgba(0,23,31,0.05)]",
        viewMode === "list"
          ? "flex flex-col sm:grid sm:grid-cols-[160px_minmax(0,1fr)] md:grid-cols-[220px_minmax(0,1fr)]"
          : "flex h-full flex-col",
      ].join(" ")}
    >
      <div
        className={
          viewMode === "list"
            ? "relative aspect-[16/7] overflow-hidden bg-muted sm:aspect-auto sm:min-h-full"
            : "relative aspect-[5/4] overflow-hidden bg-muted"
        }
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className={[
              "object-cover transition-transform duration-700",
              fullyReserved
                ? "scale-[1.01] grayscale-[0.85] saturate-[0.25] brightness-[1.04] contrast-[0.78]"
                : "saturate-[0.92] brightness-[0.9] contrast-[0.92] group-hover:scale-[1.025]",
            ].join(" ")}
            sizes={
              viewMode === "list"
                ? "(max-width: 639px) 120px, (max-width: 767px) 160px, 220px"
                : "(max-width: 768px) 100vw, 33vw"
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gift className="size-10 text-border" />
          </div>
        )}
        <div
          className={[
            "absolute inset-0",
            fullyReserved
              ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(0,23,31,0.16))]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,52,89,0.12))]",
          ].join(" ")}
        />
        {fullyReserved ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-emerald-600/15 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20">
            <CheckCircle2 className="size-3.5" />
            Purchased
          </div>
        ) : null}

        {/* Overlay badges */}
        <div className="absolute left-3 top-3">
          {!fullyReserved ? (
            <Badge className="bg-white text-[0.78rem] font-medium normal-case tracking-normal text-[var(--ink-black)] shadow-sm">
              {item.remaining_quantity} still needed
            </Badge>
          ) : null}
        </div>
        {displayPrice ? (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-[var(--deep-space-blue)]/90 px-2.5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              <Tag className="size-3.5" />
              {displayPrice}
            </span>
          </div>
        ) : null}
      </div>

      <div className="relative flex flex-1 flex-col p-4 md:p-5" data-celebrate={showRecentCelebration}>
        {showRecentCelebration ? (
          <div key={celebrationCount} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {confettiPieces.map((piece, index) => (
              <span
                key={`${item.id}-card-confetti-${index}`}
                className="confetti-piece"
                style={
                  {
                    "--confetti-left": piece.left,
                    "--confetti-drift": piece.drift,
                    "--confetti-rotate": piece.rotate,
                    "--confetti-delay": piece.delay,
                    "--confetti-duration": piece.duration,
                    "--confetti-color": piece.color,
                  } as ConfettiStyle
                }
              />
            ))}
          </div>
        ) : null}
        <p
          className={[
            "text-xs font-semibold tracking-[0.08em] [font-variant-caps:all-small-caps]",
            fullyReserved ? "text-emerald-700/80" : "text-[var(--cerulean)]",
          ].join(" ")}
        >
          {storeLabel}
        </p>
        <h3
          className={[
            "text-[1.2rem] leading-tight sm:text-[1.3rem] md:text-[1.4rem]",
            fullyReserved ? "text-[var(--ink-black)]/72 line-through decoration-2 decoration-emerald-700/40" : "",
          ].join(" ")}
        >
          {item.title}
        </h3>
        {item.notes && (
          <p className={["mt-1.5 text-sm leading-6 sm:text-[0.95rem]", viewMode === "list" ? "line-clamp-2" : "", fullyReserved ? "text-[var(--ink-black)]/48" : "text-muted-foreground"].join(" ")}>
            {item.notes}
          </p>
        )}

        <div
          className={[
            "mt-3 rounded-md px-3.5 py-2.5",
            fullyReserved
              ? "border border-emerald-700/15 bg-emerald-50"
              : "border border-[var(--cerulean)]/10 bg-[var(--soft-blue)]",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center justify-between text-xs font-medium tracking-[0.03em]",
              fullyReserved ? "text-emerald-800/75" : "text-muted-foreground",
            ].join(" ")}
          >
            <span>Purchased</span>
            <span>{item.reserved_quantity} of {item.desired_quantity}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <motion.div
              initial={prefersReducedMotion ? false : { width: 0 }}
              whileInView={prefersReducedMotion ? undefined : { width: `${reservedPct}%` }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1], delay: 0.1 }}
              className={[
                "h-full rounded-full transition-all duration-700",
                fullyReserved
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                  : "bg-gradient-to-r from-[var(--cerulean)] to-[var(--fresh-sky)]",
              ].join(" ")}
              style={prefersReducedMotion ? { width: `${reservedPct}%` } : undefined}
            />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showRecentCelebration ? (
            <motion.div
              key={`card-success-${celebrationCount}`}
              initial={prefersReducedMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0, y: -12 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0, y: -10 }}
              transition={{
                opacity: { duration: 0.24, ease: [0.2, 0, 0, 1] },
                height: { duration: 0.34, ease: [0.2, 0, 0, 1] },
                y: { duration: 0.34, ease: [0.2, 0, 0, 1] },
              }}
              className="mt-3 overflow-hidden"
            >
              <div className="rounded-md border border-cerulean/10 bg-white/78 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
                <p className="flex items-center gap-2 font-semibold text-deep-space-blue">
                  <Sparkles className="size-3.5 text-cerulean" />
                  Thank you for celebrating with us.
                </p>
                <p className="mt-1 text-sm leading-relaxed text-deep-space-blue/68">
                  We&apos;ve marked your gift so everyone stays in sync.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {fullyReserved ? (
          <div className="mt-3 rounded-md border border-emerald-700/15 bg-emerald-600 px-3.5 py-2.5 text-sm font-medium text-white">
            {showRecentCelebration ? "Your gift has been marked as claimed." : "This gift has already been claimed."}
          </div>
        ) : null}

        {!fullyReserved && (
          <div className="mt-3">
            <ReservationForm itemId={item.id} remainingQuantity={item.remaining_quantity} />
          </div>
        )}

        <div className="mt-auto pt-3">
          <Button
            asChild
            className={viewMode === "list" ? "w-full sm:w-auto" : "w-full"}
            variant={fullyReserved ? "outline" : "default"}
          >
            <a href={item.purchase_url} target="_blank" rel="noreferrer">
              {fullyReserved ? "View item" : "Purchase from store"}
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
