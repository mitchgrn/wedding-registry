import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { RegistryItemRow, RegistryItemWithStats, ReservationRow } from "@/lib/types";

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
