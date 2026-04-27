"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { toast } from "sonner";

type Status = "open" | "in_progress" | "waiting" | "done";

const LABELS: Record<Status, string> = {
  open: "Offen",
  in_progress: "In Arbeit",
  waiting: "Wartet",
  done: "Erledigt",
};

export function TaskStatusSelect({ taskId, currentStatus }: { taskId: string; currentStatus: Status }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(value: string) {
    setLoading(true);
    try {
      await updateTaskStatus(taskId, value as Status);
      router.refresh();
    } catch {
      toast.error("Fehler beim Ändern des Status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={currentStatus} onValueChange={(v) => v && handleChange(v)} disabled={loading}>
      <SelectTrigger className="w-36 h-8 text-xs">
        <SelectValue>{LABELS[currentStatus]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
