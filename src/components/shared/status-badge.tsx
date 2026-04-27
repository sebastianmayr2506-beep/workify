import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TASK_STATUS = {
  open:        { label: "Offen",       className: "bg-slate-100 text-slate-700 border-slate-200" },
  in_progress: { label: "In Arbeit",   className: "bg-blue-100 text-blue-700 border-blue-200" },
  waiting:     { label: "Wartet",      className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  done:        { label: "Erledigt",    className: "bg-green-100 text-green-700 border-green-200" },
} as const;

const PROJECT_STATUS = {
  planned: { label: "Geplant",    className: "bg-slate-100 text-slate-700 border-slate-200" },
  active:  { label: "Aktiv",      className: "bg-green-100 text-green-700 border-green-200" },
  on_hold: { label: "Pausiert",   className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  done:    { label: "Abgeschl.",  className: "bg-blue-100 text-blue-700 border-blue-200" },
} as const;

export function TaskStatusBadge({ status }: { status: keyof typeof TASK_STATUS }) {
  const { label, className } = TASK_STATUS[status] ?? TASK_STATUS.open;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", className)}>
      {label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: keyof typeof PROJECT_STATUS }) {
  const { label, className } = PROJECT_STATUS[status] ?? PROJECT_STATUS.active;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", className)}>
      {label}
    </Badge>
  );
}
