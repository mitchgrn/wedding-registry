"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition, type Dispatch, type FormEvent, type SetStateAction } from "react";
import Image from "next/image";
import { ChevronDown, Gift, LoaderCircle, RefreshCcw, RotateCcw, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import {
  autofillRegistryItemAction,
  clearItemReservationsAction,
  createRegistryItemAction,
  deleteRegistryItemAction,
  refreshPriceAction,
  toggleItemActiveAction,
  updateRegistryItemAction,
  type ActionState,
} from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registryItemSchema } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import type { RegistryItemWithStats } from "@/lib/types";

const initialState: ActionState = { status: "idle" };

export function AdminItemForm({ item, onSuccess, bare }: { item?: RegistryItemWithStats; onSuccess?: () => void; bare?: boolean }) {
  const router = useRouter();
  const action = item ? updateRegistryItemAction.bind(null, item.id) : createRegistryItemAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [toolbarMessage, setToolbarMessage] = useState<string | null>(null);
  const [isToolbarPending, startToolbarTransition] = useTransition();
  const [expanded, setExpanded] = useState(!item);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(() => createDraft(item));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmAction, setConfirmAction] = useState<null | { title: string; description: string; onConfirm: () => void }>(null);
  const previousItemId = useRef(item?.id);
  const previousUpdatedAt = useRef(item?.updated_at);
  const previousStateMessage = useRef<string | undefined>(undefined);
  const previousToolbarMessage = useRef<string | null>(null);

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
    setFieldErrors({});
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

    setFieldErrors({});
    setEditDrawerOpen(false);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "success" || item) {
      return;
    }

    router.refresh();
    onSuccess?.();
  }, [item, onSuccess, router, state.status]);

  useEffect(() => {
    if (state.status === "idle" || !state.message) {
      return;
    }

    if (previousStateMessage.current === `${state.status}:${state.message}`) {
      return;
    }

    previousStateMessage.current = `${state.status}:${state.message}`;

    if (state.status === "error") {
      toast.error(state.message);
      return;
    }

    toast.success(state.message);
  }, [state.message, state.status]);

  useEffect(() => {
    if (!state.fieldErrors) {
      return;
    }

    setFieldErrors(state.fieldErrors);
  }, [state.fieldErrors]);

  useEffect(() => {
    if (!toolbarMessage || previousToolbarMessage.current === toolbarMessage) {
      return;
    }

    previousToolbarMessage.current = toolbarMessage;

    if (/failed|could not|unable|invalid/i.test(toolbarMessage)) {
      toast.warning(toolbarMessage);
      return;
    }

    toast.success(toolbarMessage);
  }, [toolbarMessage]);

  const displayPrice =
    item?.display_price ??
    formatCurrency(item?.manual_price ?? null, item?.price_currency ?? "USD") ??
    null;

  const formFields = (
    <FormFields
      formAction={formAction}
      pending={pending}
      isToolbarPending={isToolbarPending}
      item={item}
      draft={draft}
      setDraft={setDraft}
      fieldErrors={fieldErrors}
      setFieldErrors={setFieldErrors}
      ids={{ titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId }}
      startToolbarTransition={startToolbarTransition}
      setToolbarMessage={setToolbarMessage}
    />
  );

  // ─── Confirm dialog ──────────────────────────────────────────────────────────
  const confirmDialog = (
    <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              confirmAction?.onConfirm();
              setConfirmAction(null);
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Collapsed row (existing items only) ────────────────────────────────────
  if (item) {
    return (
      <>
        {confirmDialog}

        <div className="overflow-hidden rounded-xl border border-[rgba(0,52,89,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.38))] shadow-[0_16px_40px_rgba(0,23,31,0.05)]">
          {/* Action toolbar */}
          <div className="border-b border-[var(--border)] bg-white/50 px-3 py-2 sm:px-4">
            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isToolbarPending}
                className="h-9 px-2 text-[var(--ink-black)]/65 hover:bg-white hover:text-[var(--deep-space-blue)] sm:px-3"
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
                <span>Refresh</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isToolbarPending || item.reserved_quantity < 1}
                className="h-9 border-[var(--border)] bg-white/80 px-2 hover:bg-white sm:px-3"
                onClick={() =>
                  setConfirmAction({
                    title: "Reset purchases?",
                    description: `This will remove all reservations for "${item.title}".`,
                    onConfirm: () =>
                      startToolbarTransition(async () => {
                        const result = await clearItemReservationsAction(item.id);
                        setToolbarMessage(result.message ?? null);
                        if (result.status === "success") router.refresh();
                      }),
                  })
                }
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isToolbarPending}
                className="h-9 border-[var(--border)] bg-white/80 px-2 hover:bg-white sm:px-3"
                onClick={() =>
                  startToolbarTransition(async () => {
                    const result = await toggleItemActiveAction(item.id, !item.is_active);
                    setToolbarMessage(result.message ?? null);
                  })
                }
              >
                {item.is_active ? "Archive" : "Restore"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isToolbarPending}
                className="h-9 border-red-200 bg-white/80 px-2 text-red-700 hover:bg-red-50 hover:text-red-800 sm:px-3"
                onClick={() =>
                  setConfirmAction({
                    title: "Delete item?",
                    description: `"${item.title}" and all its reservations will be permanently removed.`,
                    onConfirm: () =>
                      startToolbarTransition(async () => {
                        const result = await deleteRegistryItemAction(item.id);
                        setToolbarMessage(result.message ?? null);
                        if (result.status === "success") router.refresh();
                      }),
                  })
                }
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          </div>

          {/* Summary row */}
          <button
            type="button"
            onClick={() => {
              // On small screens use the drawer; on larger screens expand inline
              if (window.innerWidth < 1280) {
                setEditDrawerOpen(true);
              } else {
                setExpanded((v) => !v);
              }
            }}
            className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-[var(--soft-blue)]/45 sm:gap-4 sm:px-4"
          >
            {/* Thumbnail */}
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[var(--soft-blue)] sm:size-16">
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
              <p className="line-clamp-1 text-sm font-medium text-[var(--ink-black)]">{item.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {displayPrice ? <Badge>{displayPrice}</Badge> : null}
                <Badge>{item.reserved_quantity}/{item.desired_quantity} reserved</Badge>
                {!item.is_active ? <Badge tone="warning">Archived</Badge> : null}
                {item.remaining_quantity === 0 ? <Badge tone="success">Complete</Badge> : null}
              </div>
            </div>

            {/* Chevron */}
            <ChevronDown
              className={`size-4 shrink-0 text-[var(--cerulean)] transition-transform duration-200 xl:${expanded ? "rotate-180" : ""}`}
            />
          </button>

          {/* Expandable edit form — desktop only (xl+) */}
          {expanded && (
            <div className="hidden border-t border-[var(--border)] xl:block">
              <div className="bg-[var(--soft-blue)]/35 px-4 py-2 text-sm font-medium text-[var(--deep-space-blue)]">
                Edit item
              </div>
              {formFields}
            </div>
          )}
        </div>

        {/* Edit drawer — mobile/tablet */}
        <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
          <DrawerContent className="flex max-h-[92dvh] flex-col overflow-hidden xl:hidden">
            <DrawerHeader className="border-b border-[var(--border)]">
              <DrawerTitle>Edit item</DrawerTitle>
              <DrawerDescription className="line-clamp-1">{item.title}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {formFields}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // ─── New item form (always open) ─────────────────────────────────────────────
  if (bare) {
    return formFields;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(0,52,89,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.38))] shadow-[0_16px_40px_rgba(0,23,31,0.05)]">
      <CardHeader className="border-b border-[var(--border)] bg-white/55 px-4 py-4">
        <CardTitle className="text-base font-medium text-[var(--deep-space-blue)]">New item</CardTitle>
        <CardDescription>Paste a store link, then autofill the rest.</CardDescription>
      </CardHeader>
      {formFields}
    </div>
  );
}

// ─── Shared form fields ────────────────────────────────────────────────────────

type FormFieldsProps = {
  formAction: (payload: FormData) => void;
  pending: boolean;
  isToolbarPending: boolean;
  item?: RegistryItemWithStats;
  draft: RegistryItemDraft;
  setDraft: Dispatch<SetStateAction<RegistryItemDraft>>;
  fieldErrors: FieldErrors;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
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
  item,
  draft,
  setDraft,
  fieldErrors,
  setFieldErrors,
  ids,
  startToolbarTransition,
  setToolbarMessage,
}: FormFieldsProps) {
  const { titleId, purchaseId, quantityId, sortId, imageId, manualId, notesId } = ids;
  const activeId = `active-${item?.id ?? "new"}`;

  function updateField<K extends keyof RegistryItemDraft>(key: K, value: RegistryItemDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors = validateDraft(draft);

    if (Object.keys(nextErrors).length === 0) {
      return;
    }

    event.preventDefault();
    setFieldErrors(nextErrors);
    toast.error("Fix the highlighted fields before saving.");
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <CardContent className="space-y-4 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <section className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              name="title"
              value={draft.title}
              required
              aria-invalid={Boolean(fieldErrors.title)}
              className={getFieldClassName(fieldErrors.title)}
              onChange={(event) => updateField("title", event.target.value)}
            />
            {fieldErrors.title ? <p className="text-xs text-red-700">{fieldErrors.title}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={purchaseId}>Purchase link</Label>
            <div className="flex flex-col gap-2">
              <Input
                id={purchaseId}
                name="purchaseUrl"
                value={draft.purchaseUrl}
                placeholder="https://"
                required
                aria-invalid={Boolean(fieldErrors.purchaseUrl)}
                className={getFieldClassName(fieldErrors.purchaseUrl)}
                onChange={(event) => updateField("purchaseUrl", event.target.value)}
              />
              {fieldErrors.purchaseUrl ? <p className="text-xs text-red-700">{fieldErrors.purchaseUrl}</p> : null}
              <Button
                type="button"
                variant="secondary"
                disabled={isToolbarPending}
                className="h-10 w-full border-[var(--border)] bg-[var(--soft-blue)] px-4 text-[var(--deep-space-blue)] hover:bg-[var(--soft-blue)]/70"
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
                Autofill from link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={quantityId}>Quantity</Label>
              <Input
                id={quantityId}
                name="desiredQuantity"
                type="number"
                min={1}
                value={draft.desiredQuantity}
                required
                aria-invalid={Boolean(fieldErrors.desiredQuantity)}
                className={getFieldClassName(fieldErrors.desiredQuantity)}
                onChange={(event) => updateField("desiredQuantity", event.target.value)}
              />
              {fieldErrors.desiredQuantity ? <p className="text-xs text-red-700">{fieldErrors.desiredQuantity}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={sortId}>Sort order</Label>
              <Input
                id={sortId}
                name="sortOrder"
                type="number"
                min={0}
                value={draft.sortOrder}
                aria-invalid={Boolean(fieldErrors.sortOrder)}
                className={getFieldClassName(fieldErrors.sortOrder)}
                onChange={(event) => updateField("sortOrder", event.target.value)}
              />
              {fieldErrors.sortOrder ? <p className="text-xs text-red-700">{fieldErrors.sortOrder}</p> : null}
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-[var(--border)]/70 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={manualId}>Price</Label>
              <Input
                id={manualId}
                name="manualPrice"
                type="number"
                min={0}
                step="0.01"
                value={draft.manualPrice}
                aria-invalid={Boolean(fieldErrors.manualPrice)}
                className={getFieldClassName(fieldErrors.manualPrice)}
                onChange={(event) => updateField("manualPrice", event.target.value)}
              />
              {fieldErrors.manualPrice ? <p className="text-xs text-red-700">{fieldErrors.manualPrice}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={imageId}>Image URL</Label>
              <Input
                id={imageId}
                name="imageUrl"
                value={draft.imageUrl}
                aria-invalid={Boolean(fieldErrors.imageUrl)}
                className={getFieldClassName(fieldErrors.imageUrl)}
                onChange={(event) => updateField("imageUrl", event.target.value)}
              />
              {fieldErrors.imageUrl ? <p className="text-xs text-red-700">{fieldErrors.imageUrl}</p> : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={notesId}>Notes</Label>
            <Textarea
              id={notesId}
              name="notes"
              value={draft.notes}
              aria-invalid={Boolean(fieldErrors.notes)}
              className={getFieldClassName(fieldErrors.notes, true)}
              onChange={(event) => updateField("notes", event.target.value)}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--ink-black)]/45">{draft.notes.length}/400</p>
              {fieldErrors.notes ? <p className="text-xs text-red-700">{fieldErrors.notes}</p> : null}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-[var(--border)]/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <Checkbox
                id={activeId}
                name="isActive"
                checked={draft.isActive}
                onCheckedChange={(checked) => setDraft((current) => ({ ...current, isActive: checked === true }))}
              />
              <Label htmlFor={activeId} className="cursor-pointer">
                Visible on registry
              </Label>
            </div>
          </div>
          <Button type="submit" disabled={pending} className="h-11 w-full bg-[var(--deep-space-blue)] text-white hover:bg-[#00456f] sm:h-10 sm:w-auto">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {item ? "Save changes" : "Add item"}
          </Button>
        </section>
      </CardContent>
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

type FieldErrors = Partial<Record<keyof RegistryItemDraft, string>>;

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

function getFieldClassName(hasError?: string, isTextarea = false) {
  const base = isTextarea ? "min-h-24 text-base sm:text-sm" : "h-11 text-base sm:h-9 sm:text-sm";
  const tone = hasError
    ? "border-red-300 bg-red-50/70 focus:border-red-400 focus:ring-red-100"
    : "border-[var(--border)] bg-white/85 focus:border-[var(--cerulean)]/35 focus:ring-[var(--fresh-sky)]/15";
  return `${base} ${tone}`;
}

function validateDraft(draft: RegistryItemDraft): FieldErrors {
  const parsed = registryItemSchema.safeParse({
    title: draft.title,
    purchaseUrl: draft.purchaseUrl,
    desiredQuantity: draft.desiredQuantity,
    imageUrl: draft.imageUrl,
    notes: draft.notes,
    sortOrder: draft.sortOrder,
    isActive: draft.isActive,
    manualPrice: draft.manualPrice,
  });

  if (parsed.success) {
    return {};
  }

  const nextErrors: FieldErrors = {};

  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in nextErrors)) {
      nextErrors[key as keyof RegistryItemDraft] = issue.message;
    }
  }

  return nextErrors;
}
