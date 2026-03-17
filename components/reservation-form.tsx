"use client";

import type { CSSProperties } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { createReservationAction, type ActionState } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  celebrationExitMs,
  celebrationVisibleMs,
  confettiPieces,
  markReservationCelebrated,
} from "@/lib/reservation-celebration";

const initialState: ActionState = { status: "idle" };

type ConfettiStyle = CSSProperties & {
  "--confetti-left": string;
  "--confetti-drift": string;
  "--confetti-rotate": string;
  "--confetti-delay": string;
  "--confetti-duration": string;
  "--confetti-color": string;
};

export function ReservationForm({
  itemId,
  remainingQuantity,
  idPrefix = "reservation",
}: {
  itemId: string;
  remainingQuantity: number;
  idPrefix?: string;
}) {
  const [state, formAction, pending] = useActionState(createReservationAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const handledState = useRef<ActionState>(initialState);
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [celebrationPhase, setCelebrationPhase] = useState<"idle" | "visible" | "exiting">("idle");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (handledState.current === state || !state.message) {
      return;
    }

    handledState.current = state;

    if (state.status === "success") {
      formRef.current?.reset();
      markReservationCelebrated(itemId);
      setCelebrationPhase("visible");
      setCelebrationCount((count) => count + 1);
      return;
    }

    if (state.status === "error") {
      setCelebrationPhase("idle");
      toast.error(state.message);
    }
  }, [itemId, state]);

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
      setCelebrationPhase("idle");
    }, celebrationExitMs);

    return () => window.clearTimeout(timeoutId);
  }, [celebrationPhase]);

  const showSuccessState = celebrationPhase !== "idle";
  const guestFieldId = `${idPrefix}-guest-${itemId}`;
  const quantityFieldId = `${idPrefix}-qty-${itemId}`;

  return (
    <form
      ref={formRef}
      action={formAction}
      className={[
        "relative overflow-hidden space-y-2.5 rounded-xl border p-3 transition-[background-color,border-color,box-shadow] duration-500 sm:p-3.5",
        showSuccessState
          ? "border-[var(--cerulean)]/16 bg-[linear-gradient(180deg,rgba(248,252,254,0.98),rgba(255,255,255,0.98))] shadow-[0_10px_24px_rgba(0,126,167,0.07)]"
          : "border-border bg-muted/40",
      ].join(" ")}
      data-celebrate={showSuccessState}
    >
      {showSuccessState ? (
        <div key={celebrationCount} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiPieces.map((piece, index) => (
            <span
              key={`${itemId}-confetti-${index}`}
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

      <input type="hidden" name="itemId" value={itemId} />

      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary/70">
        Mark as purchased
      </p>

      <div className="space-y-2.5">
        <div className="space-y-1.5">
          <Label htmlFor={guestFieldId} className="text-xs font-medium text-muted-foreground">Your name</Label>
          <Input id={guestFieldId} name="guestName" placeholder="Full name" required className="h-10 text-base sm:h-9 sm:text-sm" />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor={quantityFieldId} className="text-xs font-medium text-muted-foreground">Qty</Label>
            <Input
              id={quantityFieldId}
              name="quantity"
              type="number"
              min={1}
              max={remainingQuantity}
              defaultValue={1}
              required
              className="h-10 text-base sm:h-9 sm:text-sm"
            />
          </div>
          <Button
            type="submit"
            className="h-10 whitespace-nowrap sm:h-9"
            disabled={pending || remainingQuantity < 1}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Mark purchased
          </Button>
        </div>
      </div>

      {state.status === "error" && state.message ? (
        <Badge
          tone="warning"
          className="w-full justify-center gap-2 py-2 text-sm"
        >
          {state.message}
        </Badge>
      ) : null}

      <AnimatePresence initial={false}>
        {showSuccessState ? (
          <motion.div
            key={`success-${celebrationCount}`}
            initial={prefersReducedMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0, y: -12 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0, y: -10 }}
            transition={{
              opacity: { duration: 0.24, ease: [0.2, 0, 0, 1] },
              height: { duration: 0.34, ease: [0.2, 0, 0, 1] },
              y: { duration: 0.34, ease: [0.2, 0, 0, 1] },
            }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-[var(--cerulean)]/10 bg-white/78 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
              <p className="flex items-center gap-2 font-semibold text-[var(--deep-space-blue)]">
                <Sparkles className="size-3.5 text-[var(--cerulean)]" />
                Thank you for celebrating with us.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--deep-space-blue)]/68">
                We&apos;ve marked your gift so everyone stays in sync.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
