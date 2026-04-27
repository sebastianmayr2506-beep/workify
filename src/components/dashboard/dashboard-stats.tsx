"use client";

import { AlertCircle, Calendar, Loader, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  overdueCount: number;
  todayCount: number;
  inProgressCount: number;
  openQuestionsCount: number;
  activeFilter: string | null;
  onFilterClick: (filter: "overdue" | "today" | "in_progress" | null) => void;
}

export function DashboardStats({
  overdueCount,
  todayCount,
  inProgressCount,
  openQuestionsCount,
  activeFilter,
  onFilterClick,
}: Props) {
  const stats = [
    {
      key: "overdue" as const,
      label: "Überfällig",
      value: overdueCount,
      icon: AlertCircle,
      color: "text-red-600",
      bg: overdueCount > 0 ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" : "bg-muted/30",
      activeBg: "bg-red-100 border-red-400 dark:bg-red-950/40",
    },
    {
      key: "today" as const,
      label: "Heute fällig",
      value: todayCount,
      icon: Calendar,
      color: "text-amber-600",
      bg: todayCount > 0 ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" : "bg-muted/30",
      activeBg: "bg-amber-100 border-amber-400 dark:bg-amber-950/40",
    },
    {
      key: "in_progress" as const,
      label: "In Arbeit",
      value: inProgressCount,
      icon: Loader,
      color: "text-blue-600",
      bg: inProgressCount > 0 ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900" : "bg-muted/30",
      activeBg: "bg-blue-100 border-blue-400 dark:bg-blue-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const active = activeFilter === stat.key;
        return (
          <button
            key={stat.key}
            onClick={() => onFilterClick(active ? null : stat.key)}
            className={cn(
              "rounded-lg border p-3 flex items-center gap-3 transition-all text-left hover:scale-[1.01]",
              active ? stat.activeBg : stat.bg,
              active && "ring-2 ring-offset-1 ring-foreground/20"
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", stat.color)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn("text-xl font-bold leading-tight", stat.color)}>{stat.value}</p>
            </div>
          </button>
        );
      })}
      <Link
        href="/questions"
        className={cn(
          "rounded-lg border p-3 flex items-center gap-3 transition-all hover:scale-[1.01]",
          openQuestionsCount > 0 ? "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900" : "bg-muted/30"
        )}
      >
        <MessageCircle className={cn("h-5 w-5 shrink-0", openQuestionsCount > 0 ? "text-violet-600" : "text-muted-foreground")} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Offene Fragen</p>
          <p className={cn("text-xl font-bold leading-tight", openQuestionsCount > 0 ? "text-violet-600" : "text-muted-foreground")}>
            {openQuestionsCount}
          </p>
        </div>
      </Link>
    </div>
  );
}
