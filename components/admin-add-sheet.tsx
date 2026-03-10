"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AdminItemForm } from "@/components/admin-item-form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

export function AdminAddSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className="h-10 shrink-0 rounded-xl bg-deep-space-blue px-4 text-white hover:bg-[#00456f] xl:hidden"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add item
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="flex max-h-[92dvh] flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>Add item</DrawerTitle>
            <DrawerDescription>Paste a store link, then autofill the rest.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AdminItemForm bare onSuccess={() => setOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
