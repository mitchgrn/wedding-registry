"use client";

import { Clipboard, Download, ExternalLink, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminReservationExportRow } from "@/lib/types";

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function createCsv(rows: AdminReservationExportRow[]) {
  const headers = ["Guest name", "Item", "Quantity", "Reserved at", "Item active", "Purchase URL"];
  const body = rows.map((row) => [
    row.guest_name,
    row.item_title,
    row.quantity,
    row.created_at,
    row.item_is_active ? "Yes" : "No",
    row.item_purchase_url,
  ]);

  return [headers, ...body].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function AdminPurchasesExport({ rows }: { rows: AdminReservationExportRow[] }) {
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const uniqueGuests = new Set(rows.map((row) => row.guest_name.trim().toLowerCase()).filter(Boolean)).size;

  function downloadCsv() {
    const csv = createCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding-registry-purchases-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Purchase CSV downloaded.");
  }

  async function copyCsv() {
    try {
      await navigator.clipboard.writeText(createCsv(rows));
      toast.success("Purchase CSV copied.");
    } catch {
      toast.error("Could not copy the CSV.");
    }
  }

  return (
    <Card className="overflow-hidden border-[rgba(0,52,89,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.3))] shadow-[0_16px_40px_rgba(0,23,31,0.05)]">
      <CardHeader className="border-b border-border bg-white/70 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ShoppingBag className="size-4 text-deep-space-blue" />
              <CardTitle className="text-lg text-deep-space-blue md:text-[1.15rem]">
                Purchases
              </CardTitle>
              <Badge className="rounded-full px-3 py-1 text-[0.7rem]">
                {totalQuantity} bought
              </Badge>
              <Badge tone="success" className="rounded-full px-3 py-1 text-[0.7rem]">
                {uniqueGuests} guests
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-black/55">
              A full list of who bought each item, ready to download or paste into a spreadsheet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyCsv} disabled={!rows.length}>
              <Clipboard className="size-4" />
              Copy CSV
            </Button>
            <Button type="button" size="sm" onClick={downloadCsv} disabled={!rows.length}>
              <Download className="size-4" />
              Download CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-soft-blue/55 text-[0.7rem] uppercase tracking-[0.08em] text-deep-space-blue">
                <tr>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Reserved</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="bg-white/70">
                    <td className="px-4 py-3 font-medium text-ink-black">{row.guest_name}</td>
                    <td className="max-w-[320px] px-4 py-3 text-ink-black/72">
                      <span className="line-clamp-2">{row.item_title}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-black/72">{row.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-black/60">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={row.item_is_active ? "success" : "default"} className="rounded-full">
                        {row.item_is_active ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.item_purchase_url ? (
                        <a
                          href={row.item_purchase_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-cerulean underline-offset-4 hover:underline"
                        >
                          Open
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="text-ink-black/35">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-ink-black/55 sm:p-10">
            No purchases yet. New reservations will appear here automatically.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
