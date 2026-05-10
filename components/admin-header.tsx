"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LayoutGrid, LogOut, Menu, ShoppingBag } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AdminHeader({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-10">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[0.03em] text-cerulean">
            Registry Admin
          </p>
          <p className="truncate text-[0.7rem] text-ink-black/55">
            {email}
          </p>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 rounded-full border border-border bg-white px-3.5 text-ink-black/70 hover:border-cerulean/30 hover:bg-soft-blue",
              pathname === "/admin" && "border-cerulean/30 bg-soft-blue text-deep-space-blue",
            )}
          >
            <Link href="/admin">
              <LayoutGrid className="size-4" />
              Items
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 rounded-full border border-border bg-white px-3.5 text-ink-black/70 hover:border-cerulean/30 hover:bg-soft-blue",
              pathname === "/admin/purchases" && "border-cerulean/30 bg-soft-blue text-deep-space-blue",
            )}
          >
            <Link href="/admin/purchases">
              <ShoppingBag className="size-4" />
              Purchases
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 rounded-full border border-border bg-white px-3.5 text-ink-black/70 hover:border-cerulean/30 hover:bg-soft-blue"
          >
            <Link href="/">
              <ExternalLink className="size-4" />
              View homepage
            </Link>
          </Button>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-9 rounded-full border border-border bg-white px-3.5 text-ink-black/70 hover:border-cerulean/30 hover:bg-soft-blue"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-10 rounded-full border border-border bg-white p-0 text-deep-space-blue hover:bg-soft-blue lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="lg:hidden">
            <SheetHeader className="pr-10">
              <SheetTitle>Admin menu</SheetTitle>
              <SheetDescription className="truncate text-[0.72rem]">
                {email}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3">
              <SheetClose asChild>
                <Button
                  variant={pathname === "/admin" ? "secondary" : "outline"}
                  className="h-11 w-full justify-start rounded-2xl px-4"
                  asChild
                >
                  <Link href="/admin">
                    <LayoutGrid className="size-4" />
                    Items
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={pathname === "/admin/purchases" ? "secondary" : "outline"}
                  className="h-11 w-full justify-start rounded-2xl px-4"
                  asChild
                >
                  <Link href="/admin/purchases">
                    <ShoppingBag className="size-4" />
                    Purchases
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start rounded-2xl px-4"
                  asChild
                >
                  <Link href="/">
                    <ExternalLink className="size-4" />
                    View homepage
                  </Link>
                </Button>
              </SheetClose>
            </div>

            <SheetFooter>
              <form action={signOutAction} className="w-full">
                <Button
                  type="submit"
                  variant="outline"
                  className="h-11 w-full justify-start rounded-2xl px-4 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
