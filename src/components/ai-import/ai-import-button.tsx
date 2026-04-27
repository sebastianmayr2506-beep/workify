"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiImportDialog } from "./ai-import-dialog";
import { createClient } from "@/lib/supabase/client";

interface CustomerOption { id: string; name: string }

export function AiImportButton() {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("customers").select("id, name").eq("user_id", user.id).eq("is_archived", false).order("name")
        .then(({ data }) => setCustomers((data as CustomerOption[]) ?? []));
    });
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-violet-700 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-800"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">KI-Import</span>
      </Button>
      <AiImportDialog customers={customers} open={open} onOpenChange={setOpen} />
    </>
  );
}
