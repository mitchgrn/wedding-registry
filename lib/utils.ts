import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null, currency = "USD") {
  if (amount === null) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

const STORE_LABELS: Record<string, string> = {
  amazon: "Amazon",
  ikea: "IKEA",
  indigo: "Indigo",
  walmart: "Walmart",
  wayfair: "Wayfair",
  canadiantire: "Canadian Tire",
  crateandbarrel: "Crate & Barrel",
  potterybarn: "Pottery Barn",
  westelm: "West Elm",
  target: "Target",
  thebay: "The Bay",
  costco: "Costco",
  etsy: "Etsy",
};

export function getStoreLabel(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const [root] = hostname.split(".");

    if (!root) {
      return "Other";
    }

    return STORE_LABELS[root] ?? root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return "Other";
  }
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
