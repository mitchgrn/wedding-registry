import { z } from "zod";

export const reservationSchema = z.object({
  itemId: z.string().uuid(),
  guestName: z.string().trim().min(2, "Please enter your name."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
});

export const registryItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Title is required."),
  purchaseUrl: z.string().trim().url("Enter a valid purchase link."),
  desiredQuantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL.")
    .or(z.literal(""))
    .transform((value) => value || null),
  notes: z
    .string()
    .trim()
    .max(400, "Keep notes under 400 characters.")
    .or(z.literal(""))
    .transform((value) => value || null),
  sortOrder: z.coerce.number().int().min(0, "Sort order cannot be negative.").default(0),
  isActive: z.boolean().default(true),
  manualPrice: z
    .union([z.literal(""), z.coerce.number().min(0, "Manual price cannot be negative.")])
    .transform((value) => (value === "" ? null : value)),
});

export const refreshPriceSchema = z.object({
  itemId: z.string().uuid(),
});

export const adminReservationAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  direction: z.enum(["increment", "decrement"]),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type RegistryItemInput = z.infer<typeof registryItemSchema>;
