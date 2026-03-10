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

const initialState: ActionState = { status: "idle" };
const celebrationVisibleMs = 1800;
const celebrationExitMs = 400;
const confettiPieces = [
  { left: "8%", drift: "-34px", rotate: "-18deg", delay: "0ms", duration: "980ms", color: "rgba(0, 126, 167, 0.95)" },
  { left: "17%", drift: "20px", rotate: "28deg", delay: "90ms", duration: "1120ms", color: "rgba(0, 168, 232, 0.9)" },
  { left: "28%", drift: "-12px", rotate: "-30deg", delay: "160ms", duration: "1040ms", color: "rgba(0, 52, 89, 0.88)" },
  { left: "40%", drift: "34px", rotate: "14deg", delay: "40ms", duration: "1080ms", color: "rgba(22, 163, 74, 0.88)" },
  { left: "51%", drift: "-22px", rotate: "36deg", delay: "130ms", duration: "1180ms", color: "rgba(0, 126, 167, 0.85)" },
  { left: "63%", drift: "18px", rotate: "-24deg", delay: "10ms", duration: "960ms", color: "rgba(245, 158, 11, 0.9)" },
  { left: "74%", drift: "-30px", rotate: "22deg", delay: "150ms", duration: "1140ms", color: "rgba(0, 168, 232, 0.84)" },
  { left: "86%", drift: "26px", rotate: "-12deg", delay: "70ms", duration: "1000ms", color: "rgba(0, 52, 89, 0.78)" },
] as const;

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
}: {
  itemId: string;
  remainingQuantity: number;
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
      setCelebrationPhase("visible");
      setCelebrationCount((count) => count + 1);
      return;
    }

    if (state.status === "error") {
      setCelebrationPhase("idle");
      toast.error(state.message);
    }
  }, [state]);

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

  return (
    <form
      ref={formRef}
      action={formAction}
      className={[
        "celebration-shell space-y-2.5 rounded-xl border p-3 transition-all duration-500",
        showSuccessState
          ? "border-[var(--cerulean)]/20 bg-[linear-gradient(180deg,rgba(234,245,251,0.7),rgba(255,255,255,0.98))] shadow-[0_18px_38px_rgba(0,126,167,0.12)]"
          : "border-border bg-muted/40",
      ].join(" ")}
      data-celebrate={showSuccessState}
    >
      {showSuccessState ? (
        <div key={celebrationCount} aria-hidden="true" className="confetti-burst">
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

      <p className="text-sm font-semibold tracking-[0.02em] text-primary">
        Purchase this gift
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor={`guest-${itemId}`}>Your name</Label>
          <Input id={`guest-${itemId}`} name="guestName" placeholder="Full name" required className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`qty-${itemId}`}>Quantity purchased</Label>
          <Input
            id={`qty-${itemId}`}
            name="quantity"
            type="number"
            min={1}
            max={remainingQuantity}
            defaultValue={1}
            required
            className="h-9"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="h-9 w-full" disabled={pending || remainingQuantity < 1}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Purchase
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

      <AnimatePresence mode="wait">
        {showSuccessState ? (
          <motion.div
            key={`success-${celebrationCount}`}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0.18 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-lg border border-white/70 bg-white/80 px-3.5 py-3 shadow-[0_10px_30px_rgba(0,52,89,0.08)] backdrop-blur-sm"
          >
            <p className="flex items-center gap-2 font-semibold text-[var(--deep-space-blue)]">
              <Sparkles className="size-3.5" />
              Thank you for celebrating with us.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--deep-space-blue)]/72">
              We&apos;ve marked your gift so everyone stays in sync.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
