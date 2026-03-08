export type RegistryItemRow = {
  id: string;
  title: string;
  purchase_url: string;
  desired_quantity: number;
  image_url: string | null;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
  manual_price: number | null;
  display_price: string | null;
  price_amount: number | null;
  price_currency: string | null;
  price_status: "success" | "failed" | "not_checked";
  price_source: string | null;
  price_fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReservationRow = {
  id: string;
  item_id: string;
  guest_name: string;
  quantity: number;
  created_at: string;
};

export type RegistryItemWithStats = RegistryItemRow & {
  reserved_quantity: number;
  remaining_quantity: number;
  reservation_count: number;
};
