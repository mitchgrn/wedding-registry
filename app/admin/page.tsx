import { redirect } from "next/navigation";
import { LayoutGrid, LogOut, Package } from "lucide-react";
import { AdminItemForm } from "@/components/admin-item-form";
import { Badge } from "@/components/ui/badge";
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
    <main className="min-h-screen bg-muted/30">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Registry Admin
            </span>
            <span className="h-3.5 w-px bg-border" />
            <span className="text-[0.7rem] text-muted-foreground">{user?.email}</span>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl">Manage registry</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add, edit, and archive gift items.</p>
        </div>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: "Public items", value: activeCount },
            { label: "Reservations", value: totalReservations },
            { label: "Fully reserved", value: fullyReservedCount },
          ].map((stat) => (
            <div key={stat.label} className="card-elevated rounded-xl p-4">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1.5 text-3xl font-light text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Two-col layout */}
        <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
          {/* Sidebar — add form */}
          <aside className="space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Add item
                </h2>
              </div>
              <AdminItemForm />
            </div>
          </aside>

          {/* Main — item list */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <LayoutGrid className="size-4 text-muted-foreground" />
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                All items
                <span className="ml-2 font-normal text-muted-foreground/60">({items.length})</span>
              </h2>
            </div>
            <div className="space-y-4">
              {items.map((item) => (
                <AdminItemForm key={item.id} item={item} />
              ))}
              {!items.length && (
                <div className="card-elevated rounded-xl border-dashed p-10 text-center text-sm text-muted-foreground">
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
