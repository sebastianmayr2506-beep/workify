import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  low:    { label: "Niedrig",  className: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Mittel",   className: "bg-blue-100 text-blue-700 border-blue-200" },
  high:   { label: "Hoch",     className: "bg-orange-100 text-orange-700 border-orange-200" },
  urgent: { label: "Dringend", className: "bg-red-100 text-red-700 border-red-200" },
} as const;

export function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_CONFIG }) {
  const { label, className } = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", className)}>
      {label}
    </Badge>
  );
}
