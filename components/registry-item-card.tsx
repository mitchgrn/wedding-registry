import Image from "next/image";
import { ExternalLink, Gift, Tag } from "lucide-react";
import { ReservationForm } from "@/components/reservation-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getStoreLabel } from "@/lib/utils";
import type { RegistryItemWithStats } from "@/lib/types";

export function RegistryItemCard({
  item,
  viewMode = "grid",
}: {
  item: RegistryItemWithStats;
  viewMode?: "list" | "grid";
}) {
  const displayPrice =
    item.display_price ??
    formatCurrency(item.manual_price, item.price_currency ?? "USD") ??
    "Price varies";

  const reservedPct =
    item.desired_quantity > 0
      ? Math.min(100, Math.round((item.reserved_quantity / item.desired_quantity) * 100))
      : 0;

  const fullyReserved = item.remaining_quantity <= 0;
  const storeLabel = getStoreLabel(item.purchase_url);

  return (
    <article
      className={[
        "card-floating group overflow-hidden rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--cerulean)]/30",
        viewMode === "list"
          ? "grid gap-0 md:grid-cols-[260px_minmax(0,1fr)]"
          : "flex h-full flex-col",
      ].join(" ")}
    >
      <div
        className={
          viewMode === "list"
            ? "relative min-h-[220px] overflow-hidden bg-muted"
            : "relative aspect-[4/3] overflow-hidden bg-muted"
        }
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            sizes={
              viewMode === "list" ? "(max-width: 768px) 100vw, 260px" : "(max-width: 768px) 100vw, 33vw"
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gift className="size-10 text-border" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--deep-space-blue)]/10 to-transparent" />

        {/* Overlay badges */}
        <div className="absolute left-3 top-3">
          <Badge tone={fullyReserved ? "warning" : "success"}>
            {fullyReserved ? "All set" : `${item.remaining_quantity} still needed`}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/20 bg-[var(--deep-space-blue)]/90 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <Tag className="size-3.5" />
            {displayPrice}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--cerulean)]">
          {storeLabel}
        </p>
        <h3 className="text-[1.5rem] leading-tight">{item.title}</h3>
        {item.notes && (
          <p className="mt-2 text-base leading-7 text-muted-foreground">{item.notes}</p>
        )}

        <div className="mt-4 rounded-md border border-[var(--cerulean)]/10 bg-[var(--soft-blue)] px-4 py-3">
          <div className="flex items-center justify-between text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span>Purchased</span>
            <span>{item.reserved_quantity} of {item.desired_quantity}</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--cerulean)] to-[var(--fresh-sky)] transition-all duration-700"
              style={{ width: `${reservedPct}%` }}
            />
          </div>
        </div>

        {!fullyReserved && (
          <div className="mt-4">
            <ReservationForm itemId={item.id} remainingQuantity={item.remaining_quantity} />
          </div>
        )}

        <div className="mt-4">
          <Button
            asChild
            className={viewMode === "list" ? "w-full sm:w-auto" : "w-full"}
            variant={fullyReserved ? "outline" : "default"}
            size="lg"
          >
            <a href={item.purchase_url} target="_blank" rel="noreferrer">
              {fullyReserved ? "View item" : "Purchase from store"}
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
