"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Gift, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ReservationForm } from "@/components/reservation-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  const displayPrice = rawPrice?.replace(/[A-Z]{2,3}\$/, "$").replace(/\s?[A-Z]{2,3}$/, "") ?? null;
  const priceLabel = displayPrice ?? "Price unavailable";
  const reservedPct =
    item.desired_quantity > 0
      ? Math.min(100, Math.round((item.reserved_quantity / item.desired_quantity) * 100))
      : 0;
  const fullyReserved = item.remaining_quantity <= 0;
  const showsQuantityProgress = item.desired_quantity > 1;
  const storeLabel = getStoreLabel(item.purchase_url);
  const quantityLabel = fullyReserved
    ? item.desired_quantity === 1
      ? "Purchased"
      : `Purchased ${item.reserved_quantity} of ${item.desired_quantity}`
    : item.desired_quantity === 1
      ? "Still needed"
      : `${item.remaining_quantity} still needed`;
  const progressLabel =
    fullyReserved && item.desired_quantity === 1 ? null : fullyReserved ? "Purchased" : `${item.reserved_quantity} of ${item.desired_quantity} purchased`;
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [celebrationPhase, setCelebrationPhase] = useState<"idle" | "visible" | "exiting">("idle");
  const [mobileReservationOpen, setMobileReservationOpen] = useState(false);
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
    <>
      <motion.article
        initial={false}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        whileHover={undefined}
        className="sm:hidden"
      >
        <Card
          className={[
            "relative overflow-hidden rounded-[1.35rem] border bg-white shadow-[0_6px_18px_rgba(0,23,31,0.06)]",
            fullyReserved
              ? "border-[var(--deep-space-blue)]/12 bg-[linear-gradient(180deg,rgba(248,251,253,0.98),rgba(238,245,249,0.92))]"
              : "border-[rgba(0,52,89,0.1)]",
          ].join(" ")}
          data-celebrate={showRecentCelebration}
        >
          {showRecentCelebration ? (
            <div key={`mobile-confetti-${celebrationCount}`} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              {confettiPieces.map((piece, index) => (
                <span
                  key={`${item.id}-mobile-confetti-${index}`}
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

          <CardContent className="p-3.5">
            <div className="flex items-start gap-3">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className={[
                      "object-cover object-center",
                      fullyReserved
                        ? "grayscale-[0.85] saturate-[0.25] brightness-[1.04] contrast-[0.78]"
                        : "saturate-[0.92] brightness-[0.92] contrast-[0.94]",
                    ].join(" ")}
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Gift className="size-8 text-border" />
                  </div>
                )}
                {fullyReserved ? (
                  <div className="absolute inset-x-2 bottom-2 rounded-full bg-emerald-600 px-2 py-1 text-center text-[0.68rem] font-semibold tracking-[0.04em] text-white shadow-lg shadow-emerald-900/20">
                    Purchased
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-[var(--soft-blue)] text-[var(--deep-space-blue)]">{storeLabel}</Badge>
                </div>

                <h3
                  className={[
                    "mt-2 text-[1.1rem] leading-[1.15] text-[var(--ink-black)]",
                    fullyReserved ? "line-through decoration-2 decoration-emerald-700/35 text-[var(--ink-black)]/72" : "",
                  ].join(" ")}
                >
                  {item.title}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <p className={["text-base font-semibold", displayPrice ? "text-[var(--deep-space-blue)]" : "text-muted-foreground"].join(" ")}>
                    {priceLabel}
                  </p>
                  {!displayPrice ? <Badge>Pending</Badge> : null}
                </div>

                {showsQuantityProgress ? (
                  <>
                    <p className={["mt-2 text-sm leading-5", fullyReserved ? "text-emerald-800/75" : "text-muted-foreground"].join(" ")}>
                      {quantityLabel}
                      {progressLabel ? <span className="mx-1.5 text-border/80">·</span> : null}
                      {progressLabel}
                    </p>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                      <motion.div
                        initial={prefersReducedMotion ? false : { width: 0 }}
                        whileInView={prefersReducedMotion ? undefined : { width: `${reservedPct}%` }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.45, ease: [0.2, 0, 0, 1], delay: 0.05 }}
                        className={[
                          "h-full rounded-full",
                          fullyReserved
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                            : "bg-gradient-to-r from-[var(--cerulean)] to-[var(--fresh-sky)]",
                        ].join(" ")}
                        style={prefersReducedMotion ? { width: `${reservedPct}%` } : undefined}
                      />
                    </div>
                  </>
                ) : null}

                {item.notes ? (
                  <p className={["mt-2 line-clamp-2 text-sm leading-5", fullyReserved ? "text-[var(--ink-black)]/50" : "text-[var(--ink-black)]/68"].join(" ")}>
                    {item.notes}
                  </p>
                ) : null}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showRecentCelebration ? (
                <motion.div
                  key={`mobile-success-${celebrationCount}`}
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
                  <div className="rounded-xl border border-cerulean/10 bg-white/78 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
                    <p className="flex items-center gap-2 font-semibold text-deep-space-blue">
                      <Sparkles className="size-3.5 text-cerulean" />
                      Thank you for celebrating with us.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="grid grid-cols-2 gap-2.5 px-3.5 pb-3.5 pt-0">
            <Button asChild variant="outline" className="h-10 rounded-xl px-3 text-sm">
              <a href={item.purchase_url} target="_blank" rel="noreferrer">
                View item
                <ExternalLink />
              </a>
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl px-3 text-sm"
              onClick={() => setMobileReservationOpen(true)}
              disabled={fullyReserved}
            >
              {fullyReserved ? "Already purchased" : "Mark purchased"}
            </Button>
          </CardFooter>
        </Card>
      </motion.article>

      <motion.article
        initial={false}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        whileHover={undefined}
        className={[
          "group hidden overflow-hidden rounded-[1.4rem] border border-[rgba(0,52,89,0.1)] bg-white shadow-[0_1px_4px_rgba(0,23,31,0.05)] transition-[box-shadow,border-color] duration-[180ms] sm:flex",
          fullyReserved
            ? "border-[var(--deep-space-blue)]/12 bg-[linear-gradient(180deg,rgba(248,251,253,0.98),rgba(238,245,249,0.92))] hover:border-[var(--deep-space-blue)]/20"
            : "hover:border-[var(--cerulean)]/20 hover:shadow-[0_4px_16px_rgba(0,23,31,0.09),0_1px_4px_rgba(0,23,31,0.05)]",
          viewMode === "list"
            ? "flex-col sm:grid sm:grid-cols-[160px_minmax(0,1fr)] md:grid-cols-[220px_minmax(0,1fr)]"
            : "h-full flex-col",
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

          <div className="absolute left-3 top-3">
            {!fullyReserved ? (
              <Badge className="bg-white text-[0.78rem] font-medium normal-case tracking-normal text-[var(--ink-black)] shadow-sm">
                {item.remaining_quantity} still needed
              </Badge>
            ) : null}
          </div>
          {displayPrice ? (
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center rounded-md border border-white/20 bg-[var(--deep-space-blue)]/90 px-2.5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
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
          {item.notes ? (
            <p className={["mt-1.5 text-sm leading-6 sm:text-[0.95rem]", viewMode === "list" ? "line-clamp-2" : "", fullyReserved ? "text-[var(--ink-black)]/48" : "text-muted-foreground"].join(" ")}>
              {item.notes}
            </p>
          ) : null}

          {showsQuantityProgress ? (
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
          ) : null}

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
              {showRecentCelebration ? "Your gift has been marked as purchased." : "This gift has already been purchased."}
            </div>
          ) : null}

          {!fullyReserved ? (
            <div className="mt-3">
              <ReservationForm itemId={item.id} remainingQuantity={item.remaining_quantity} />
            </div>
          ) : null}

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

      <Drawer open={mobileReservationOpen} onOpenChange={setMobileReservationOpen} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[92dvh] sm:hidden">
          <DrawerHeader className="border-b border-border pb-4 pr-10">
            <DrawerTitle className="text-[1.25rem] leading-tight">{item.title}</DrawerTitle>
            {item.notes ? <DrawerDescription className="text-sm">{item.notes}</DrawerDescription> : null}
          </DrawerHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {fullyReserved ? (
              <div className="rounded-[1.1rem] border border-emerald-700/15 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                This gift has already been purchased.
              </div>
            ) : (
              <ReservationForm itemId={item.id} remainingQuantity={item.remaining_quantity} idPrefix="mobile-reservation" />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
