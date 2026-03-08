"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { createReservationAction, type ActionState } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = { status: "idle" };

export function ReservationForm({
  itemId,
  remainingQuantity,
}: {
  itemId: string;
  remainingQuantity: number;
}) {
  const [state, formAction, pending] = useActionState(createReservationAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <input type="hidden" name="itemId" value={itemId} />

      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary">
        Purchase this gift
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor={`guest-${itemId}`}>Your name</Label>
          <Input id={`guest-${itemId}`} name="guestName" placeholder="Full name" required />
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
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={pending || remainingQuantity < 1}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Purchase
          </Button>
        </div>
      </div>

      {state.message ? (
        <Badge
          tone={state.status === "success" ? "success" : "warning"}
          className="w-full justify-center py-2"
        >
          {state.message}
        </Badge>
      ) : null}
    </form>
  );
}
