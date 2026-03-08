"use client";

import { ArrowUpDown, Grid3X3, List, Search, ShoppingBag } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { RegistryItemCard } from "@/components/registry-item-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RegistryItemWithStats } from "@/lib/types";
import { getStoreLabel } from "@/lib/utils";

type SortKey = "title" | "price-asc" | "price-desc" | "unpurchased";
type ViewMode = "list" | "grid";

function getSortablePrice(item: RegistryItemWithStats) {
  return item.manual_price ?? item.price_amount ?? Number.POSITIVE_INFINITY;
}

export function RegistryBrowser({ items }: { items: RegistryItemWithStats[] }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("title");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hidePurchased, setHidePurchased] = useState(false);
  const [storeFilter, setStoreFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const stores = Array.from(new Set(items.map((item) => getStoreLabel(item.purchase_url)))).sort((a, b) =>
    a.localeCompare(b),
  );

  const filteredItems = items
    .filter((item) => {
      if (hidePurchased && item.remaining_quantity <= 0) {
        return false;
      }

      const store = getStoreLabel(item.purchase_url);
      if (storeFilter !== "all" && store !== storeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [item.title, item.notes ?? "", item.display_price ?? "", store]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    })
    .sort((left, right) => {
      switch (sortBy) {
        case "unpurchased":
          if ((left.remaining_quantity > 0) !== (right.remaining_quantity > 0)) {
            return left.remaining_quantity > 0 ? -1 : 1;
          }
          return left.title.localeCompare(right.title);
        case "title":
          return left.title.localeCompare(right.title);
        case "price-asc":
          return getSortablePrice(left) - getSortablePrice(right);
        case "price-desc":
          return getSortablePrice(right) - getSortablePrice(left);
        default:
          return left.title.localeCompare(right.title);
      }
    });

  return (
    <div className="space-y-8">
      <Card className="rounded-lg border-[var(--cerulean)]/10 bg-gradient-to-b from-[var(--fresh-sky)]/[0.04] to-white">
        <CardContent className="space-y-5 px-4 pb-4 pt-4 md:px-5">
          <div className="flex flex-col gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="inline-flex w-full rounded-lg border border-border bg-[var(--soft-blue)] p-1 sm:w-auto">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-9 flex-1 rounded-md px-4 text-sm sm:flex-none"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
              >
                <List className="size-4" />
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="h-9 flex-1 rounded-md px-4 text-sm sm:flex-none"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
              >
                <Grid3X3 className="size-4" />
                Grid
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
            <div className="space-y-2">
              <Label htmlFor="registry-search" className="flex items-center gap-2 text-sm font-medium text-[var(--ink-black)]">
                <Search className="size-4 text-[var(--cerulean)]" />
                Search
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="registry-search"
                  aria-label="Search registry items"
                  className="h-10 rounded-lg border-border bg-white pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search gifts, notes, price, or store"
                  value={query}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registry-store-filter" className="flex items-center gap-2 text-sm font-medium text-[var(--ink-black)]">
                <ShoppingBag className="size-4 text-[var(--cerulean)]" />
                Store
              </Label>
              <Select onValueChange={setStoreFilter} value={storeFilter}>
                <SelectTrigger id="registry-store-filter" aria-label="Filter registry items by store">
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registry-sort" className="flex items-center gap-2 text-sm font-medium text-[var(--ink-black)]">
                <ArrowUpDown className="size-4 text-[var(--cerulean)]" />
                Sort
              </Label>
              <Select onValueChange={(value) => setSortBy(value as SortKey)} value={sortBy}>
                <SelectTrigger id="registry-sort" aria-label="Sort registry items">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpurchased">Unpurchased first</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="price-asc">Price: Low to high</SelectItem>
                  <SelectItem value="price-desc">Price: High to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/80 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <Label
              htmlFor="registry-hide-purchased"
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-[var(--soft-blue)] px-4 py-3 text-sm font-medium text-[var(--ink-black)]"
            >
              <Checkbox
                id="registry-hide-purchased"
                checked={hidePurchased}
                className="size-4 rounded-[0.3rem]"
                onChange={(event) => setHidePurchased(event.target.checked)}
              />
              <span>Hide purchased gifts</span>
            </Label>

            <div className="flex flex-wrap items-center gap-2">
              <Badge>{filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} shown</Badge>
              <Badge tone="success">{viewMode === "grid" ? "Grid view" : "List view"}</Badge>
              {storeFilter !== "all" ? <Badge tone="success">{storeFilter}</Badge> : null}
              {hidePurchased ? <Badge tone="warning">Purchased hidden</Badge> : null}
            </div>
          </div>

        </CardContent>
      </Card>

      {filteredItems.length ? (
        <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" : "space-y-5"}>
          {filteredItems.map((item) => (
            <RegistryItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="card-elevated rounded-2xl border-dashed p-16 text-center text-sm text-muted-foreground">
          No registry items match your search.
        </div>
      )}
    </div>
  );
}
