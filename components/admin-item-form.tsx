"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Gift, LoaderCircle, RefreshCcw, WandSparkles } from "lucide-react";
import {
  autofillRegistryItemAction,
  createRegistryItemAction,
  refreshPriceAction,
  toggleItemActiveAction,
  updateRegistryItemAction,
  type ActionState,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { RegistryItemWithStats } from "@/lib/types";

const initialState: ActionState = { status: "idle" };

export function AdminItemForm({ item }: { item?: RegistryItemWithStats }) {
  const action = item ? updateRegistryItemAction.bind(null, item.id) : createRegistryItemAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [toolbarMessage, setToolbarMessage] = useState<string | null>(null);
  const [isToolbarPending, startToolbarTransition] = useTransition();
  // Saved items start collapsed; new item form always open
  const [expanded, setExpanded] = useState(!item);

  const titleId = `title-${item?.id ?? "new"}`;
  const purchaseId = `purchase-${item?.id ?? "new"}`;
  const quantityId = `quantity-${item?.id ?? "new"}`;
  const sortId = `sort-${item?.id ?? "new"}`;
  const imageId = `image-${item?.id ?? "new"}`;
  const manualId = `manual-${item?.id ?? "new"}`;
  const notesId = `notes-${item?.id ?? "new"}`;

  const setInputValue = (id: string, value: string | number | null | undefined, replaceExisting = false) => {
    const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!element || value === null || value === undefined || value === "") return;
    if (!replaceExisting && element.value.trim()) return;
    element.value = String(value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const displayPrice =
    item?.display_price ??
    formatCurrency(item?.manual_price ?? null, item?.price_currency ?? "USD") ??
    null;

  const statusMessage = toolbarMessage ?? state.message;

  // ─── Collapsed row (existing items only) ────────────────────────────────────
  if (item) {
    return (
      <div className="card-elevated overflow-hidden rounded-xl">
        {/* Summary row — always visible */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-muted/40"
        >
          {/* Thumbnail */}
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Gift className="size-6 text-border" />
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
            <div className="mt-0.5 flex items-center gap-3 text-[0.68rem] text-muted-foreground">
              {displayPrice && <span>{displayPrice}</span>}
              {displayPrice && <span className="h-2.5 w-px bg-border" />}
              <span>
                {item.reserved_quantity}/{item.desired_quantity} reserved
              </span>
              {!item.is_active && (
                <>
                  <span className="h-2.5 w-px bg-border" />
                  <span className="text-warning">Archived</span>
                </>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* Expandable edit form */}
        {expanded && (
          <div className="border-t border-border">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-2.5">
              <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Edit item
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isToolbarPending}
                  onClick={() =>
                    startToolbarTransition(async () => {
                      const result = await refreshPriceAction(item.id);
                      setToolbarMessage(result.message ?? null);
                    })
                  }
                >
                  {isToolbarPending ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-3.5" />
                  )}
                  Refresh price
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isToolbarPending}
                  onClick={() =>
                    startToolbarTransition(async () => {
                      const result = await toggleItemActiveAction(item.id, !item.is_active);
                      setToolbarMessage(result.message ?? null);
                    })
                  }
                >
                  {item.is_active ? "Archive" : "Restore"}
                </Button>
              </div>
            </div>

            <FormFields
              formAction={formAction}
              pending={pending}
              isToolbarPending={isToolbarPending}
              statusMessage={statusMessage}
              item={item}
              ids={{ titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId }}
              setInputValue={setInputValue}
              startToolbarTransition={startToolbarTransition}
              setToolbarMessage={setToolbarMessage}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── New item form (always open) ─────────────────────────────────────────────
  return (
    <div className="card-elevated overflow-hidden rounded-xl">
      <div className="border-b border-border px-5 py-3.5">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          New item
        </span>
      </div>
      <FormFields
        formAction={formAction}
        pending={pending}
        isToolbarPending={isToolbarPending}
        statusMessage={statusMessage}
        ids={{ titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId }}
        setInputValue={setInputValue}
        startToolbarTransition={startToolbarTransition}
        setToolbarMessage={setToolbarMessage}
      />
    </div>
  );
}

// ─── Shared form fields ────────────────────────────────────────────────────────

type FormFieldsProps = {
  formAction: (payload: FormData) => void;
  pending: boolean;
  isToolbarPending: boolean;
  statusMessage: string | null | undefined;
  item?: RegistryItemWithStats;
  ids: {
    titleId: string;
    purchaseId: string;
    quantityId: string;
    sortId: string;
    imageId: string;
    manualId: string;
    notesId: string;
  };
  setInputValue: (id: string, value: string | number | null | undefined, replace?: boolean) => void;
  startToolbarTransition: (fn: () => Promise<void>) => void;
  setToolbarMessage: (msg: string | null) => void;
};

function FormFields({
  formAction,
  pending,
  isToolbarPending,
  statusMessage,
  item,
  ids,
  setInputValue,
  startToolbarTransition,
  setToolbarMessage,
}: FormFieldsProps) {
  const { titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId } = ids;

  return (
    <form action={formAction} className="grid gap-4 p-5 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={titleId}>Title</Label>
        <Input id={titleId} name="title" defaultValue={item?.title} required />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={purchaseId}>Purchase link</Label>
            <Input
              id={purchaseId}
              name="purchaseUrl"
              defaultValue={item?.purchase_url}
              placeholder="https://"
              required
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isToolbarPending}
            className="shrink-0"
            onClick={() =>
              startToolbarTransition(async () => {
                const purchaseUrl =
                  (document.getElementById(purchaseId) as HTMLInputElement | null)?.value ?? "";
                const result = await autofillRegistryItemAction(purchaseUrl);
                setToolbarMessage(result.message ?? null);
                if (result.status === "success") {
                  setInputValue(purchaseId, result.resolvedUrl, true);
                  setInputValue(titleId, result.title);
                  setInputValue(imageId, result.imageUrl);
                  setInputValue(notesId, result.notes);
                  setInputValue(manualId, result.manualPrice);
                }
              })
            }
          >
            {isToolbarPending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <WandSparkles className="size-3.5" />
            )}
            Autofill
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={quantityId}>Desired quantity</Label>
        <Input
          id={quantityId}
          name="desiredQuantity"
          type="number"
          min={1}
          defaultValue={item?.desired_quantity ?? 1}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={sortId}>Sort order</Label>
        <Input
          id={sortId}
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={item?.sort_order ?? 0}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={imageId}>Image URL</Label>
        <Input id={imageId} name="imageUrl" defaultValue={item?.image_url ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={manualId}>Manual price fallback</Label>
        <Input
          id={manualId}
          name="manualPrice"
          type="number"
          min={0}
          step="0.01"
          defaultValue={item?.manual_price ?? ""}
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea id={notesId} name="notes" defaultValue={item?.notes ?? ""} />
      </div>

      <div className="flex items-center justify-between gap-4 md:col-span-2">
        <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={item?.is_active ?? true}
            className="size-4 rounded border-border accent-primary"
          />
          Visible on registry
        </label>
        <div className="flex items-center gap-3">
          {statusMessage && (
            <span className="text-xs text-muted-foreground">{statusMessage}</span>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {item ? "Save" : "Add item"}
          </Button>
        </div>
      </div>
    </form>
  );
}
