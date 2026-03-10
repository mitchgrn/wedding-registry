import { redirect } from "next/navigation";
import { LayoutGrid, Package } from "lucide-react";
import { AdminAddSheet } from "@/components/admin-add-sheet";
import { AdminHeader } from "@/components/admin-header";
import { AdminItemForm } from "@/components/admin-item-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getAdminRegistryItems } from "@/lib/data";
import { hasClientEnv, serverEnv } from "@/lib/env";

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
      <AdminHeader email={user?.email} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10 md:py-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[2.4rem] italic text-[var(--ink-black)] sm:text-4xl md:text-5xl">Manage registry</h1>
            <p className="mt-2 text-sm text-[var(--ink-black)]/58">Add, edit, and archive gift items.</p>
          </div>
          <AdminAddSheet />
        </div>

        <div className="mb-8 md:mb-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: "Public items", value: activeCount },
              { label: "Reservations", value: totalReservations },
              { label: "Fully reserved", value: fullyReservedCount },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.55))] p-3 shadow-[0_16px_40px_rgba(0,23,31,0.05)] sm:p-4"
              >
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.06em] text-[var(--cerulean)] sm:text-xs sm:tracking-[0.03em]">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-light text-[var(--ink-black)] sm:mt-1.5 sm:text-3xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:gap-8">
          <aside className="hidden space-y-6 xl:block xl:sticky xl:top-24 xl:self-start">
            <Card className="overflow-hidden border-[rgba(0,52,89,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.42))] shadow-[0_16px_40px_rgba(0,23,31,0.05)]">
              <CardHeader className="border-b border-[var(--border)] bg-white/70 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-[var(--deep-space-blue)]" />
                  <CardTitle className="text-lg text-[var(--deep-space-blue)] md:text-[1.15rem]">
                    Add item
                  </CardTitle>
                </div>
                <p className="text-sm text-[var(--ink-black)]/55">
                  Start with the store link, then autofill the rest if the page can be parsed.
                </p>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
                <AdminItemForm />
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            <Card className="overflow-hidden border-[rgba(0,52,89,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.3))] shadow-[0_16px_40px_rgba(0,23,31,0.05)]">
              <CardHeader className="border-b border-[var(--border)] bg-white/70 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <LayoutGrid className="size-4 text-[var(--deep-space-blue)]" />
                  <CardTitle className="text-lg text-[var(--deep-space-blue)] md:text-[1.15rem]">
                    All items
                  </CardTitle>
                  <Badge className="rounded-full px-3 py-1 text-[0.7rem]">
                    {items.length} total
                  </Badge>
                </div>
                <p className="text-sm text-[var(--ink-black)]/55">
                  Tap any item to edit. Use the toolbar to archive, reset, or delete.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-3 py-3 sm:px-4 sm:py-4">
                {items.map((item) => (
                  <AdminItemForm key={item.id} item={item} />
                ))}
                {!items.length && (
                  <div className="rounded-xl border border-dashed border-[var(--cerulean)]/25 bg-[var(--soft-blue)]/35 p-8 text-center text-sm text-[var(--ink-black)]/55 sm:p-10">
                    No items yet. Use the form to create the first registry entry.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
