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
const celebrationVisibleMs = 3200;
const celebrationExitMs = 550;
const confettiPieces = [
  { left: "4%", drift: "-42px", rotate: "-24deg", delay: "0ms", duration: "1180ms", color: "rgba(0, 126, 167, 1)" },
  { left: "10%", drift: "18px", rotate: "34deg", delay: "45ms", duration: "1240ms", color: "rgba(0, 168, 232, 0.98)" },
  { left: "18%", drift: "-12px", rotate: "-32deg", delay: "120ms", duration: "1120ms", color: "rgba(255, 184, 0, 0.96)" },
  { left: "26%", drift: "34px", rotate: "22deg", delay: "70ms", duration: "1200ms", color: "rgba(0, 52, 89, 0.92)" },
  { left: "34%", drift: "-26px", rotate: "-18deg", delay: "160ms", duration: "1280ms", color: "rgba(16, 185, 129, 0.92)" },
  { left: "42%", drift: "26px", rotate: "38deg", delay: "20ms", duration: "1140ms", color: "rgba(0, 126, 167, 0.94)" },
  { left: "50%", drift: "-18px", rotate: "-40deg", delay: "90ms", duration: "1220ms", color: "rgba(0, 168, 232, 1)" },
  { left: "58%", drift: "28px", rotate: "26deg", delay: "140ms", duration: "1160ms", color: "rgba(255, 184, 0, 0.94)" },
  { left: "66%", drift: "-34px", rotate: "-28deg", delay: "60ms", duration: "1260ms", color: "rgba(0, 52, 89, 0.9)" },
  { left: "74%", drift: "22px", rotate: "30deg", delay: "180ms", duration: "1180ms", color: "rgba(16, 185, 129, 0.9)" },
  { left: "84%", drift: "-20px", rotate: "-20deg", delay: "110ms", duration: "1100ms", color: "rgba(0, 126, 167, 0.95)" },
  { left: "92%", drift: "30px", rotate: "16deg", delay: "35ms", duration: "1210ms", color: "rgba(0, 168, 232, 0.95)" },
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
        "relative overflow-hidden space-y-2.5 rounded-xl border p-3 transition-[background-color,border-color,box-shadow] duration-500",
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

      <p className="text-sm font-semibold tracking-[0.02em] text-primary">
        Mark as purchased
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
            Mark as purchased
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
