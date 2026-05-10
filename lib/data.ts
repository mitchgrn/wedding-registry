import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { AdminReservationExportRow, RegistryItemRow, RegistryItemWithStats, ReservationRow } from "@/lib/types";

function mergeItemsWithReservations(items: RegistryItemRow[], reservations: ReservationRow[]) {
  return items.map<RegistryItemWithStats>((item) => {
    const matching = reservations.filter((reservation) => reservation.item_id === item.id);
    const reservedQuantity = matching.reduce((sum, reservation) => sum + reservation.quantity, 0);

    return {
      ...item,
      reserved_quantity: reservedQuantity,
      remaining_quantity: Math.max(item.desired_quantity - reservedQuantity, 0),
      reservation_count: matching.length,
    };
  });
}

export async function getPublicRegistryItems() {
  const supabase = await createServerSupabaseClient();
  const { data: items } = await supabase
    .from("registry_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: reservations } = await supabase.from("registry_reservations").select("*");

  return mergeItemsWithReservations(
    (items as RegistryItemRow[] | null) ?? [],
    (reservations as ReservationRow[] | null) ?? [],
  );
}

export async function getAdminRegistryItems() {
  const supabase = createServiceRoleClient();
  const { data: items } = await supabase
    .from("registry_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: reservations } = await supabase.from("registry_reservations").select("*");

  return mergeItemsWithReservations(
    (items as RegistryItemRow[] | null) ?? [],
    (reservations as ReservationRow[] | null) ?? [],
  );
}

export async function getAdminReservationExportRows() {
  const supabase = createServiceRoleClient();
  const [{ data: reservations }, { data: items }] = await Promise.all([
    supabase
      .from("registry_reservations")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("registry_items")
      .select("id, title, purchase_url, is_active"),
  ]);

  const itemsById = new Map(
    ((items as Pick<RegistryItemRow, "id" | "title" | "purchase_url" | "is_active">[] | null) ?? []).map((item) => [
      item.id,
      item,
    ]),
  );

  return ((reservations as ReservationRow[] | null) ?? []).map<AdminReservationExportRow>((reservation) => {
    const item = itemsById.get(reservation.item_id);

    return {
      ...reservation,
      item_title: item?.title ?? "Deleted item",
      item_purchase_url: item?.purchase_url ?? "",
      item_is_active: item?.is_active ?? false,
    };
  });
}
