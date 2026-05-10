import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { AdminPurchasesExport } from "@/components/admin-purchases-export";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getAdminReservationExportRows } from "@/lib/data";
import { hasClientEnv, serverEnv } from "@/lib/env";

export default async function AdminPurchasesPage() {
  if (!hasClientEnv() || !serverEnv.success) {
    redirect("/admin/login");
  }

  await requireAdmin();
  const [user, purchaseRows] = await Promise.all([
    getCurrentUser(),
    getAdminReservationExportRows(),
  ]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(234,245,251,0.35),rgba(255,255,255,1)_20%)]">
      <AdminHeader email={user?.email} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10 md:py-12">
        <div className="mb-8">
          <h1 className="text-[2.4rem] italic text-ink-black sm:text-4xl md:text-5xl">Purchase exports</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-black/58">
            Review every reservation by guest and item, then copy or download the full list for thank-you notes and records.
          </p>
        </div>

        <AdminPurchasesExport rows={purchaseRows} />
      </div>
    </main>
  );
}
