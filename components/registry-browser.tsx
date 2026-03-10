"use client";

import { ArrowUpDown, Check, Grid3X3, List, Search, SearchX, ShoppingBag } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RegistryItemCard } from "@/components/registry-item-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
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
  const prefersReducedMotion = useReducedMotion();
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

  const hasActiveFilters = Boolean(normalizedQuery) || storeFilter !== "all" || hidePurchased || sortBy !== "title";

  return (
    <div className="space-y-8">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
      >
        <Card className="rounded-[1.35rem] border-[var(--cerulean)]/10 bg-[linear-gradient(180deg,rgba(248,252,254,0.98),rgba(255,255,255,0.98))] shadow-[0_10px_30px_rgba(0,52,89,0.04)]">
          <CardContent className="space-y-5 px-4 pb-4 pt-4 md:px-5">
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

            <div className="flex flex-col gap-3 border-t border-border/80 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="registry-hide-purchased"
                  className={[
                    "group flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors sm:min-w-[18rem] sm:max-w-[24rem] sm:flex-1",
                    hidePurchased
                      ? "border-primary/30 bg-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      : "border-border bg-[var(--soft-blue)]/70 hover:border-primary/20 hover:bg-[var(--soft-blue)]",
                  ].join(" ")}
                >
                  <span className="block text-sm font-medium text-[var(--ink-black)]">Hide purchased gifts</span>
                  <span className="relative flex shrink-0 items-center justify-center self-center">
                    <Checkbox
                      id="registry-hide-purchased"
                      checked={hidePurchased}
                      aria-label="Hide purchased gifts"
                      className="peer size-5 cursor-pointer appearance-none rounded-md border border-border bg-white shadow-sm transition data-[state=checked]:border-primary data-[state=checked]:bg-primary checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setHidePurchased(event.target.checked)}
                    />
                    <Check className="pointer-events-none absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition peer-checked:opacity-100" />
                  </span>
                </label>

                <div className="inline-flex w-full rounded-lg border border-border bg-[var(--soft-blue)] p-1 sm:w-auto sm:shrink-0">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {filteredItems.length ? (
          <motion.div
            key={viewMode}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className={[
              viewMode === "grid" ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" : "space-y-5",
            ].join(" ")}
          >
            {filteredItems.map((item) => (
              <RegistryItemCard key={item.id} item={item} viewMode={viewMode} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <EmptyState
              icon={<SearchX className="size-5" />}
              title="No registry items match your search."
              description="Try a different search term, store filter, or sort order."
              actions={
                hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setSortBy("title");
                      setStoreFilter("all");
                      setHidePurchased(false);
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
