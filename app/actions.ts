"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lookupPrice, scrapeProductPage } from "@/lib/price";
import { refreshPriceSchema, registryItemSchema, reservationSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type AutofillState = {
  status: "success" | "error";
  message?: string;
  resolvedUrl?: string | null;
  title?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  manualPrice?: number | null;
};

export async function createReservationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = reservationSchema.safeParse({
    itemId: formData.get("itemId"),
    guestName: formData.get("guestName"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("reserve_registry_item", {
    p_item_id: parsed.data.itemId,
    p_guest_name: parsed.data.guestName,
    p_quantity: parsed.data.quantity,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { status: "success", message: "Requested successfully." };
}

async function upsertRegistryItem(formData: FormData, currentId?: string): Promise<ActionState> {
  await requireAdmin();

  const parsed = registryItemSchema.safeParse({
    id: currentId ?? undefined,
    title: formData.get("title"),
    purchaseUrl: formData.get("purchaseUrl"),
    desiredQuantity: formData.get("desiredQuantity"),
    imageUrl: formData.get("imageUrl"),
    notes: formData.get("notes"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
    manualPrice: formData.get("manualPrice"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid item." };
  }

  const supabase = createServiceRoleClient();
  const lookup = await lookupPrice(parsed.data.purchaseUrl);

  const payload = {
    title: parsed.data.title,
    purchase_url: parsed.data.purchaseUrl,
    desired_quantity: parsed.data.desiredQuantity,
    image_url: parsed.data.imageUrl,
    notes: parsed.data.notes,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
    manual_price: parsed.data.manualPrice,
    display_price:
      lookup.displayPrice ??
      (parsed.data.manualPrice !== null ? `$${parsed.data.manualPrice.toFixed(2)}` : null),
    price_amount: lookup.amount,
    price_currency: lookup.currency,
    price_status: lookup.status,
    price_source: lookup.source,
    price_fetched_at: lookup.status === "success" ? new Date().toISOString() : null,
  };

  const query = currentId
    ? supabase.from("registry_items").update(payload).eq("id", currentId)
    : supabase.from("registry_items").insert(payload);

  const { error } = await query;

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { status: "success", message: currentId ? "Item updated." : "Item added." };
}

export async function createRegistryItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return upsertRegistryItem(formData);
}

export async function autofillRegistryItemAction(url: string): Promise<AutofillState> {
  await requireAdmin();

  const parsed = registryItemSchema.shape.purchaseUrl.safeParse(url);
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid product URL first." };
  }

  const scraped = await scrapeProductPage(parsed.data);

  if (!scraped.title && !scraped.description && !scraped.imageUrl && scraped.price.amount === null) {
    return { status: "error", message: "Could not extract product details from that page." };
  }

  return {
    status: "success",
    message: scraped.resolvedUrl && scraped.resolvedUrl !== parsed.data ? "Link resolved and product details filled." : "Product details filled from the link.",
    resolvedUrl: scraped.resolvedUrl,
    title: scraped.title,
    notes: scraped.description,
    imageUrl: scraped.imageUrl,
    manualPrice: scraped.price.amount,
  };
}

export async function updateRegistryItemAction(
  itemId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return upsertRegistryItem(formData, itemId);
}

export async function refreshPriceAction(itemId: string): Promise<ActionState> {
  await requireAdmin();
  const parsed = refreshPriceSchema.safeParse({ itemId });

  if (!parsed.success) {
    return { status: "error", message: "Invalid item." };
  }

  const supabase = createServiceRoleClient();
  const { data: item, error: itemError } = await supabase
    .from("registry_items")
    .select("purchase_url, manual_price")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return { status: "error", message: "Unable to load item." };
  }

  const lookup = await lookupPrice(item.purchase_url);
  const { error } = await supabase
    .from("registry_items")
    .update({
      display_price:
        lookup.displayPrice ?? (item.manual_price !== null ? `$${Number(item.manual_price).toFixed(2)}` : null),
      price_amount: lookup.amount,
      price_currency: lookup.currency,
      price_status: lookup.status,
      price_source: lookup.source,
      price_fetched_at: lookup.status === "success" ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { status: "success", message: lookup.status === "success" ? "Price refreshed." : "Price fetch failed." };
}

export async function toggleItemActiveAction(itemId: string, nextState: boolean): Promise<ActionState> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("registry_items").update({ is_active: nextState }).eq("id", itemId);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { status: "success", message: nextState ? "Item restored." : "Item archived." };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/admin");
  revalidatePath("/admin/login");
  redirect("/admin/login");
}
