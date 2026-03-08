"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
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
  const router = useRouter();
  const action = item ? updateRegistryItemAction.bind(null, item.id) : createRegistryItemAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [toolbarMessage, setToolbarMessage] = useState<string | null>(null);
  const [isToolbarPending, startToolbarTransition] = useTransition();
  const [expanded, setExpanded] = useState(!item);
  const [draft, setDraft] = useState(() => createDraft(item));
  const previousItemId = useRef(item?.id);
  const previousUpdatedAt = useRef(item?.updated_at);

  const titleId = `title-${item?.id ?? "new"}`;
  const purchaseId = `purchase-${item?.id ?? "new"}`;
  const quantityId = `quantity-${item?.id ?? "new"}`;
  const sortId = `sort-${item?.id ?? "new"}`;
  const imageId = `image-${item?.id ?? "new"}`;
  const manualId = `manual-${item?.id ?? "new"}`;
  const notesId = `notes-${item?.id ?? "new"}`;

  useEffect(() => {
    if (item?.id === previousItemId.current) {
      return;
    }

    previousItemId.current = item?.id;
    previousUpdatedAt.current = item?.updated_at;
    setDraft(createDraft(item));
  }, [item]);

  useEffect(() => {
    if (!item || item.updated_at === previousUpdatedAt.current) {
      return;
    }

    previousUpdatedAt.current = item.updated_at;
    setDraft(createDraft(item));
  }, [item]);

  useEffect(() => {
    if (state.status !== "success" || item) {
      return;
    }

    setDraft(createDraft(undefined));
  }, [item, state.status]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  const displayPrice =
    item?.display_price ??
    formatCurrency(item?.manual_price ?? null, item?.price_currency ?? "USD") ??
    null;

  const statusMessage = toolbarMessage ?? state.message;

  // ─── Collapsed row (existing items only) ────────────────────────────────────
  if (item) {
    return (
      <div className="card-elevated overflow-hidden rounded-xl border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.38))] shadow-[0_16px_40px_rgba(0,23,31,0.05)]">
        {/* Summary row — always visible */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-[var(--soft-blue)]/45"
        >
          {/* Thumbnail */}
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[var(--soft-blue)]">
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
            <p className="truncate text-sm font-medium text-[var(--ink-black)]">{item.title}</p>
            <div className="mt-0.5 flex items-center gap-3 text-[0.68rem] text-[var(--ink-black)]/52">
              {displayPrice && <span>{displayPrice}</span>}
              {displayPrice && <span className="h-2.5 w-px bg-[var(--border)]" />}
              <span>
                {item.reserved_quantity}/{item.desired_quantity} reserved
              </span>
              {!item.is_active && (
                <>
                  <span className="h-2.5 w-px bg-[var(--border)]" />
                  <span className="text-warning">Archived</span>
                </>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`size-4 shrink-0 text-[var(--cerulean)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* Expandable edit form */}
        {expanded && (
          <div className="border-t border-[var(--border)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 bg-[var(--soft-blue)]/45 px-4 py-2.5">
              <span className="text-sm font-medium text-[var(--deep-space-blue)]">
                Edit item
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isToolbarPending}
                  className="text-[var(--ink-black)]/65 hover:bg-white hover:text-[var(--deep-space-blue)]"
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
                  className="border-[var(--border)] bg-white/80 hover:bg-white"
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
              draft={draft}
              setDraft={setDraft}
              ids={{ titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId }}
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
    <div className="card-elevated overflow-hidden rounded-xl border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.38))] shadow-[0_16px_40px_rgba(0,23,31,0.05)]">
      <div className="border-b border-[var(--border)] px-5 py-3.5">
        <span className="text-base font-medium text-[var(--deep-space-blue)]">
          New item
        </span>
      </div>
      <FormFields
        formAction={formAction}
        pending={pending}
        isToolbarPending={isToolbarPending}
        statusMessage={statusMessage}
        draft={draft}
        setDraft={setDraft}
        ids={{ titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId }}
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
  draft: RegistryItemDraft;
  setDraft: React.Dispatch<React.SetStateAction<RegistryItemDraft>>;
  ids: {
    titleId: string;
    purchaseId: string;
    quantityId: string;
    sortId: string;
    imageId: string;
    manualId: string;
    notesId: string;
  };
  startToolbarTransition: (fn: () => Promise<void>) => void;
  setToolbarMessage: (msg: string | null) => void;
};

function FormFields({
  formAction,
  pending,
  isToolbarPending,
  statusMessage,
  item,
  draft,
  setDraft,
  ids,
  startToolbarTransition,
  setToolbarMessage,
}: FormFieldsProps) {
  const { titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId } = ids;

  return (
    <form action={formAction} className="grid gap-4 p-5 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={titleId}>Title</Label>
        <Input
          id={titleId}
          name="title"
          value={draft.title}
          required
          className="border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15"
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={purchaseId}>Purchase link</Label>
            <Input
              id={purchaseId}
              name="purchaseUrl"
              value={draft.purchaseUrl}
              placeholder="https://"
              required
              className="border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15"
              onChange={(event) => setDraft((current) => ({ ...current, purchaseUrl: event.target.value }))}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isToolbarPending}
            className="shrink-0 border-[var(--border)] bg-[var(--soft-blue)] text-[var(--deep-space-blue)] hover:bg-[var(--soft-blue)]/70"
            onClick={() =>
              startToolbarTransition(async () => {
                const result = await autofillRegistryItemAction(draft.purchaseUrl);
                setToolbarMessage(result.message ?? null);
                if (result.status === "success") {
                  setDraft((current) => ({
                    ...current,
                    purchaseUrl: result.resolvedUrl ?? current.purchaseUrl,
                    title: current.title.trim() ? current.title : (result.title ?? current.title),
                    imageUrl: current.imageUrl.trim() ? current.imageUrl : (result.imageUrl ?? current.imageUrl),
                    notes: current.notes.trim() ? current.notes : (result.notes ?? current.notes),
                    manualPrice:
                      current.manualPrice.trim() ? current.manualPrice : formatNumberInput(result.manualPrice),
                  }));
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
          value={draft.desiredQuantity}
          required
          className="border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15"
          onChange={(event) => setDraft((current) => ({ ...current, desiredQuantity: event.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={sortId}>Sort order</Label>
        <Input
          id={sortId}
          name="sortOrder"
          type="number"
          min={0}
          value={draft.sortOrder}
          className="border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15"
          onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={imageId}>Image URL</Label>
        <Input
          id={imageId}
          name="imageUrl"
          value={draft.imageUrl}
          className="border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15"
          onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={manualId}>Manual price fallback</Label>
        <Input
          id={manualId}
          name="manualPrice"
          type="number"
          min={0}
          step="0.01"
          value={draft.manualPrice}
          className="border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15"
          onChange={(event) => setDraft((current) => ({ ...current, manualPrice: event.target.value }))}
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          name="notes"
          value={draft.notes}
          className="border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15"
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
        />
      </div>

      <div className="flex items-center justify-between gap-4 md:col-span-2">
        <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-xs text-[var(--ink-black)]/55">
          <input
            type="checkbox"
            name="isActive"
            checked={draft.isActive}
            className="size-4 rounded border-[var(--border)] accent-[var(--deep-space-blue)]"
            onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
          />
          Visible on registry
        </label>
        <div className="flex items-center gap-3">
          {statusMessage && <span className="text-xs text-[var(--ink-black)]/52">{statusMessage}</span>}
          <Button
            type="submit"
            disabled={pending}
            className="bg-[var(--deep-space-blue)] text-white hover:bg-[#00456f]"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {item ? "Save" : "Add item"}
          </Button>
        </div>
      </div>
    </form>
  );
}

type RegistryItemDraft = {
  title: string;
  purchaseUrl: string;
  desiredQuantity: string;
  sortOrder: string;
  imageUrl: string;
  manualPrice: string;
  notes: string;
  isActive: boolean;
};

function createDraft(item?: RegistryItemWithStats): RegistryItemDraft {
  return {
    title: item?.title ?? "",
    purchaseUrl: item?.purchase_url ?? "",
    desiredQuantity: String(item?.desired_quantity ?? 1),
    sortOrder: String(item?.sort_order ?? 0),
    imageUrl: item?.image_url ?? "",
    manualPrice: item?.manual_price === null || item?.manual_price === undefined ? "" : String(item.manual_price),
    notes: item?.notes ?? "",
    isActive: item?.is_active ?? true,
  };
}

function formatNumberInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}
