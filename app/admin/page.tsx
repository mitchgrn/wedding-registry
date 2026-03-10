import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, LayoutGrid, LogOut, Package } from "lucide-react";
import { AdminItemForm } from "@/components/admin-item-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getAdminRegistryItems } from "@/lib/data";
import { hasClientEnv, serverEnv } from "@/lib/env";
import { signOutAction } from "@/app/actions";

export default async function AdminPage() {
  if (!hasClientEnv() || !serverEnv.success) {
    redirect("/admin/login");
  }

  await requireAdmin();
  const user = await getCurrentUser();
  const items = await getAdminRegistryItems();

  const activeCount = items.filter((i) => i.is_active).length;
  const totalReservations = items.reduce((sum, i) => sum + i.reserved_quantity, 0);
  const fullyReservedCount = items.filter((i) => i.remaining_quantity === 0).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(234,245,251,0.35),rgba(255,255,255,1)_20%)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-[0.03em] text-[var(--cerulean)]">
              Registry Admin
            </span>
            <span className="h-3.5 w-px bg-[var(--border)]" />
            <span className="text-[0.7rem] text-[var(--ink-black)]/55">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full border border-[var(--border)] bg-white px-3.5 text-[var(--ink-black)]/70 hover:border-[var(--cerulean)]/30 hover:bg-[var(--soft-blue)]"
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
                className="rounded-full border border-[var(--border)] bg-white px-3.5 text-[var(--ink-black)]/70 hover:border-[var(--cerulean)]/30 hover:bg-[var(--soft-blue)]"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <div className="mb-8">
          <h1 className="text-4xl italic text-[var(--ink-black)] md:text-5xl">Manage registry</h1>
          <p className="mt-2 text-sm text-[var(--ink-black)]/58">Add, edit, and archive gift items.</p>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: "Public items", value: activeCount },
            { label: "Reservations", value: totalReservations },
            { label: "Fully reserved", value: fullyReservedCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.55))] p-4 shadow-[0_16px_40px_rgba(0,23,31,0.05)]"
            >
              <p className="text-sm font-medium tracking-[0.03em] text-[var(--cerulean)]">
                {stat.label}
              </p>
              <p className="mt-1.5 text-3xl font-light text-[var(--ink-black)]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
          <aside className="space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Package className="size-4 text-[var(--deep-space-blue)]" />
                <h2 className="text-lg text-[var(--deep-space-blue)] md:text-[1.15rem]">
                  Add item
                </h2>
              </div>
              <AdminItemForm />
            </div>
          </aside>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <LayoutGrid className="size-4 text-[var(--deep-space-blue)]" />
              <h2 className="text-lg text-[var(--deep-space-blue)] md:text-[1.15rem]">
                All items
                <span className="ml-2 font-normal text-[var(--ink-black)]/45">({items.length})</span>
              </h2>
            </div>
            <div className="space-y-4">
              {items.map((item) => (
                <AdminItemForm key={item.id} item={item} />
              ))}
              {!items.length && (
                <div className="rounded-xl border border-dashed border-[var(--cerulean)]/25 bg-[var(--soft-blue)]/35 p-10 text-center text-sm text-[var(--ink-black)]/55">
                  No items yet. Use the form to create the first registry entry.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
