"use client";

import { ArrowUpDown, Copy, Grid3X3, Info, List, Search, SearchX, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { RegistryItemCard } from "@/components/registry-item-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
const shippingAddress = "Taylor Hrabarchuk\n5804 Rannock Avenue\nWinnipeg, MB R3R 2A4\nCANADA";

function getSortablePrice(item: RegistryItemWithStats) {
  return item.manual_price ?? item.price_amount ?? Number.POSITIVE_INFINITY;
}

function isPurchased(item: RegistryItemWithStats) {
  return item.remaining_quantity <= 0 || item.reserved_quantity >= item.desired_quantity;
}

export function RegistryBrowser({ items }: { items: RegistryItemWithStats[] }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("title");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hidePurchased, setHidePurchased] = useState(false);
  const [storeFilter, setStoreFilter] = useState("all");
  const [filterInfoOpen, setFilterInfoOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileShippingOpen, setMobileShippingOpen] = useState(false);
  // Draft state — only committed when the drawer "Show results" button is tapped
  const [draftSortBy, setDraftSortBy] = useState<SortKey>("title");
  const [draftHidePurchased, setDraftHidePurchased] = useState(false);
  const [draftStoreFilter, setDraftStoreFilter] = useState("all");
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.1 });
  const isBottomInView = useInView(bottomRef, { amount: 0 });
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const stores = Array.from(new Set(items.map((item) => getStoreLabel(item.purchase_url)))).sort((a, b) =>
    a.localeCompare(b),
  );
  const activeFilterCount = Number(storeFilter !== "all") + Number(hidePurchased) + Number(sortBy !== "title");

  const filteredItems = items
    .filter((item) => {
      if (hidePurchased && isPurchased(item)) {
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
          if (isPurchased(left) !== isPurchased(right)) {
            return isPurchased(left) ? 1 : -1;
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

  useEffect(() => {
    if (!filterInfoOpen) {
      return;
    }

    if (window.matchMedia("(max-width: 639px)").matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterInfoOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterInfoOpen]);

  async function handleCopyShippingAddress() {
    try {
      await navigator.clipboard.writeText(shippingAddress);
      toast.success("Shipping address copied.");
    } catch {
      toast.error("Could not copy the shipping address.");
    }
  }

  function resetFilters() {
    setQuery("");
    setSortBy("title");
    setStoreFilter("all");
    setHidePurchased(false);
  }

  function openMobileFilters() {
    setDraftSortBy(sortBy);
    setDraftHidePurchased(hidePurchased);
    setDraftStoreFilter(storeFilter);
    setMobileFiltersOpen(true);
  }

  function applyMobileFilters() {
    setSortBy(draftSortBy);
    setHidePurchased(draftHidePurchased);
    setStoreFilter(draftStoreFilter);
    setMobileFiltersOpen(false);
  }

  function resetDraftFilters() {
    setDraftSortBy("title");
    setDraftHidePurchased(false);
    setDraftStoreFilter("all");
  }

  const draftFilterCount = Number(draftStoreFilter !== "all") + Number(draftHidePurchased) + Number(draftSortBy !== "title");

  return (
    <div ref={sectionRef} className="space-y-6 pb-16 sm:space-y-8 sm:pb-0">
      {/* Floating bottom bar — mobile only */}
      <motion.div
        className="fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 z-40 flex justify-center px-4 pb-4 sm:hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView && !isBottomInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.2, 0, 0, 1] }}
      >
        <div className="flex w-full max-w-sm items-center gap-1 rounded-2xl border border-ink-black/10 bg-white p-2 shadow-[0_8px_32px_rgba(0,23,31,0.18),0_2px_8px_rgba(0,23,31,0.08)]">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-black/40" />
            <Input
              aria-label="Search registry items"
              className="h-10 rounded-xl border-transparent bg-ink-black/[0.04] pl-9 pr-9 text-base focus:border-border focus:bg-white"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              value={query}
            />
            {query ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-black/40"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-black/70 transition-colors hover:bg-ink-black/[0.04] hover:text-ink-black"
            onClick={() => setMobileShippingOpen(true)}
            aria-label="View shipping info"
          >
            <Info className="size-4 text-cerulean" />
            Shipping
          </button>

          <button
            type="button"
            className="relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-black/70 transition-colors hover:bg-ink-black/[0.04] hover:text-ink-black"
            onClick={openMobileFilters}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="size-4 text-cerulean" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex size-[1rem] items-center justify-center rounded-full bg-cerulean text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
      >
        <Card className="hidden rounded-[1.35rem] border-[var(--cerulean)]/10 bg-[linear-gradient(180deg,rgba(248,252,254,0.98),rgba(255,255,255,0.98))] shadow-[0_10px_30px_rgba(0,52,89,0.04)] sm:block">
          <CardContent className="space-y-5 px-4 pb-4 pt-4 sm:px-5">
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
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
                    className="h-11 rounded-xl border-border bg-white pl-9 text-base sm:h-10 sm:text-sm"
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
                  <SelectTrigger id="registry-store-filter" aria-label="Filter registry items by store" className="h-11 rounded-xl text-base sm:h-10 sm:text-sm">
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
                  <SelectTrigger id="registry-sort" aria-label="Sort registry items" className="h-11 rounded-xl text-base sm:h-10 sm:text-sm">
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
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label
                  htmlFor="registry-hide-purchased"
                  className={[
                    "group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors lg:min-w-[18rem] lg:max-w-[24rem] lg:flex-1",
                    hidePurchased
                      ? "border-primary/30 bg-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      : "border-border bg-[var(--soft-blue)]/70 hover:border-primary/20 hover:bg-[var(--soft-blue)]",
                  ].join(" ")}
                >
                  <span className="block text-sm font-medium text-[var(--ink-black)]">Hide purchased gifts</span>
                  <Checkbox
                    id="registry-hide-purchased"
                    checked={hidePurchased}
                    aria-label="Hide purchased gifts"
                    onCheckedChange={(checked) => setHidePurchased(checked === true)}
                  />
                </label>

                <div className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:w-auto lg:grid-cols-none lg:auto-cols-max lg:grid-flow-col lg:items-center lg:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 justify-center rounded-xl border-border bg-white/90 px-4 text-sm font-medium text-[var(--ink-black)] shadow-[0_6px_18px_rgba(0,52,89,0.06)] hover:bg-[var(--soft-blue)] sm:h-10"
                    onClick={() => setFilterInfoOpen(true)}
                  >
                    <Info className="size-4 text-[var(--cerulean)]" />
                    Shipping info
                  </Button>

                  <div className="inline-flex w-full rounded-lg border border-border bg-[var(--soft-blue)] p-1 lg:w-auto lg:shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={viewMode === "list" ? "default" : "ghost"}
                      className="h-10 flex-1 rounded-md px-4 text-sm lg:h-9 lg:flex-none"
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
                      className="h-10 flex-1 rounded-md px-4 text-sm lg:h-9 lg:flex-none"
                      onClick={() => setViewMode("grid")}
                      aria-pressed={viewMode === "grid"}
                    >
                      <Grid3X3 className="size-4" />
                      Grid
                    </Button>
                  </div>
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
              viewMode === "grid" ? "grid gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3" : "space-y-4 sm:space-y-5",
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
                    onClick={resetFilters}
                  >
                    Clear filters
                  </Button>
                ) : null
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer open={mobileFiltersOpen} onOpenChange={(open) => { if (!open) setMobileFiltersOpen(false); }}>
        <DrawerContent className="sm:hidden">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle>Filters</DrawerTitle>
              {draftFilterCount > 0 ? (
                <button
                  type="button"
                  className="text-sm font-medium text-cerulean"
                  onClick={resetDraftFilters}
                >
                  Reset
                </button>
              ) : null}
            </div>
          </DrawerHeader>

          <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-2 pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="registry-store-filter-mobile" className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Store
              </Label>
              <Select onValueChange={setDraftStoreFilter} value={draftStoreFilter}>
                <SelectTrigger id="registry-store-filter-mobile" aria-label="Filter by store" className="h-11 rounded-xl text-base">
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="registry-sort-mobile" className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Sort
              </Label>
              <Select onValueChange={(value) => setDraftSortBy(value as SortKey)} value={draftSortBy}>
                <SelectTrigger id="registry-sort-mobile" aria-label="Sort items" className="h-11 rounded-xl text-base">
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

            <label
              htmlFor="registry-hide-purchased-mobile"
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3.5"
            >
              <span className="text-sm font-medium">Hide purchased gifts</span>
              <Checkbox
                id="registry-hide-purchased-mobile"
                checked={draftHidePurchased}
                aria-label="Hide purchased gifts"
                onCheckedChange={(checked) => setDraftHidePurchased(checked === true)}
              />
            </label>
          </div>

          <DrawerFooter className="pb-6 pt-3">
            <Button type="button" className="h-12 w-full rounded-xl text-base font-medium" onClick={applyMobileFilters}>
              Apply filters
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={mobileShippingOpen} onOpenChange={setMobileShippingOpen}>
        <DrawerContent className="sm:hidden">
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle>Shipping address</DrawerTitle>
            <DrawerDescription>Use this address if the store ships directly.</DrawerDescription>
          </DrawerHeader>

          <div className="px-5 pt-5">
            <div className="rounded-[1.2rem] border border-cerulean/12 bg-muted/40 p-4">
              <address className="not-italic text-sm leading-7 text-ink-black/80">
                Taylor Hrabarchuk
                <br />
                5804 Rannock Avenue
                <br />
                Winnipeg, MB R3R 2A4
                <br />
                CANADA
              </address>
            </div>
          </div>

          <DrawerFooter className="pt-4">
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base font-medium"
              onClick={handleCopyShippingAddress}
            >
              <Copy className="size-4" />
              Copy address
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="ghost" className="h-10 w-full text-sm text-muted-foreground">
                Done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AnimatePresence>
        {filterInfoOpen ? (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,23,31,0.48)] px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-8"
            onClick={() => setFilterInfoOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-info-title"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[1.4rem] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,251,253,0.98))] p-5 shadow-[0_24px_80px_rgba(0,23,31,0.22)] sm:max-h-none sm:rounded-[1.6rem] sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cerulean)]">
                    Shipping info
                  </p>
                  <h3 id="filter-info-title" className="font-[family-name:var(--font-display)] text-[1.65rem] leading-none text-[var(--ink-black)] sm:text-[1.9rem]">
                    Shipping address
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="size-9 rounded-full p-0 text-[var(--ink-black)]/65 hover:bg-[var(--soft-blue)]"
                  onClick={() => setFilterInfoOpen(false)}
                  aria-label="Close shipping info"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="mt-5 rounded-[1.2rem] border border-[var(--cerulean)]/12 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-5">
                <address className="not-italic text-sm leading-7 text-[var(--ink-black)]/80 sm:text-base">
                  Taylor Hrabarchuk
                  <br />
                  5804 Rannock Avenue
                  <br />
                  Winnipeg, MB R3R 2A4
                  <br />
                  CANADA
                </address>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-10 w-full justify-center rounded-xl sm:w-auto"
                  onClick={handleCopyShippingAddress}
                >
                  <Copy className="size-4" />
                  Copy address
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
