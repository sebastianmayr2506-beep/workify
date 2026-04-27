"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Props {
  taskId: string;
  taskTitle: string;
}

export function TimerSection({ taskId, taskTitle }: Props) {
  return (
    <div className="rounded-lg border border-dashed p-4 flex items-center gap-3 text-muted-foreground">
      <Clock className="h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">Zeiterfassung</p>
        <p className="text-xs">Kommt in Phase 3 — Start/Stop-Button, Einträge, Summen.</p>
      </div>
      <Badge variant="outline" className="ml-auto text-xs">Phase 3</Badge>
    </div>
  );
}
