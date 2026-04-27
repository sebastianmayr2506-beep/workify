"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveCustomer } from "@/lib/actions/customers";
import { toast } from "sonner";

export function CustomerArchiveButton({ id, isArchived }: { id: string; isArchived: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      await archiveCustomer(id, !isArchived);
      toast.success(isArchived ? "Kunde reaktiviert." : "Kunde archiviert.");
      router.push("/customers");
    } catch {
      toast.error("Fehler.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {isArchived ? <ArchiveRestore className="h-4 w-4 mr-1.5" /> : <Archive className="h-4 w-4 mr-1.5" />}
        {isArchived ? "Reaktivieren" : "Archivieren"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={isArchived ? "Kunde reaktivieren?" : "Kunde archivieren?"}
        description={isArchived ? "Der Kunde wird wieder in der aktiven Liste angezeigt." : "Der Kunde wird aus der aktiven Liste ausgeblendet."}
        confirmLabel={isArchived ? "Reaktivieren" : "Archivieren"}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
