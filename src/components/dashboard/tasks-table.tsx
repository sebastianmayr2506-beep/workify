"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Play, Square, ChevronUp, ChevronDown, ChevronsUpDown, Timer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateTaskStatus, updateTask } from "@/lib/actions/tasks";
import { startTimer, stopTimer, stopAndStartTimer } from "@/lib/actions/time-entries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DashboardTask } from "@/lib/actions/dashboard";

interface Props {
  tasks: DashboardTask[];
  runningTimerTaskId: string | null;
  runningTimerEntryId: string | null;
  onTimerChange: () => void;
}

type SortKey = "title" | "customer_name" | "project_name" | "due_date" | "priority" | "status" | "total_minutes";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: "open", label: "Offen", color: "text-slate-600 bg-slate-50 border-slate-200" },
  { value: "in_progress", label: "In Arbeit", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "waiting", label: "Wartet", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "done", label: "Erledigt", color: "text-green-700 bg-green-50 border-green-200" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Niedrig", color: "text-slate-600 bg-slate-50 border-slate-200" },
  { value: "medium", label: "Mittel", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "high", label: "Hoch", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "urgent", label: "Dringend", color: "text-red-600 bg-red-50 border-red-200" },
];

const PRIORITY_ORDER: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
const STATUS_ORDER: Record<string, number> = { in_progress: 4, open: 3, waiting: 2, done: 1 };

function formatMinutes(min: number): string {
  if (min === 0) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

function formatDueDate(date: string | null): { text: string; className: string } {
  if (!date) return { text: "—", className: "text-muted-foreground" };
  const due = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const text = due.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "2-digit" });
  if (diffDays < 0) return { text, className: "text-red-600 font-semibold" };
  if (diffDays === 0) return { text: "Heute", className: "text-amber-600 font-semibold" };
  if (diffDays === 1) return { text: "Morgen", className: "text-amber-600" };
  if (diffDays <= 7) return { text, className: "text-foreground" };
  return { text, className: "text-muted-foreground" };
}

export function TasksTable({ tasks, runningTimerTaskId, runningTimerEntryId, onTimerChange }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("due_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function setPending(id: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    let av: string | number | null = a[sortKey] as string | number | null;
    let bv: string | number | null = b[sortKey] as string | number | null;

    // Special sort orders
    if (sortKey === "priority") { av = PRIORITY_ORDER[a.priority]; bv = PRIORITY_ORDER[b.priority]; }
    if (sortKey === "status") { av = STATUS_ORDER[a.status]; bv = STATUS_ORDER[b.status]; }

    // Nulls last on asc, first on desc
    if (av === null && bv === null) return 0;
    if (av === null) return sortDir === "asc" ? 1 : -1;
    if (bv === null) return sortDir === "asc" ? -1 : 1;

    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function handleToggleDone(task: DashboardTask) {
    setPending(task.id, true);
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, task.status === "done" ? "open" : "done");
        if (task.status !== "done") toast.success("Erledigt ✓");
      } finally {
        setPending(task.id, false);
      }
    });
  }

  function handleStatusChange(task: DashboardTask, status: DashboardTask["status"]) {
    setPending(task.id, true);
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, status);
      } finally {
        setPending(task.id, false);
      }
    });
  }

  function handlePriorityChange(task: DashboardTask, priority: DashboardTask["priority"]) {
    setPending(task.id, true);
    startTransition(async () => {
      try {
        await updateTask(task.id, { priority });
      } finally {
        setPending(task.id, false);
      }
    });
  }

  function handleTimer(task: DashboardTask) {
    const isRunningHere = runningTimerTaskId === task.id;
    setPending(task.id, true);
    startTransition(async () => {
      try {
        if (isRunningHere && runningTimerEntryId) {
          await stopTimer(runningTimerEntryId, task.id);
          toast.success("Timer gestoppt.");
        } else if (runningTimerTaskId && runningTimerEntryId) {
          // Switch from another task
          await stopAndStartTimer(runningTimerEntryId, runningTimerTaskId, task.id);
          toast.success("Timer gewechselt.");
        } else {
          const result = await startTimer(task.id);
          if (result.conflict) {
            toast.error("Es läuft schon ein Timer. Bitte erst stoppen.");
          } else {
            toast.success("Timer gestartet.");
          }
        }
        onTimerChange();
      } finally {
        setPending(task.id, false);
      }
    });
  }

  function SortHeader({ label, sortKey: key }: { label: string; sortKey: SortKey }) {
    const Icon = sortKey === key ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
    return (
      <button
        onClick={() => toggleSort(key)}
        className="flex items-center gap-1 hover:text-foreground transition-colors text-left w-full"
      >
        {label}
        <Icon className={cn("h-3 w-3", sortKey === key ? "text-foreground" : "text-muted-foreground/50")} />
      </button>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <p className="text-2xl mb-2">📭</p>
        <p className="font-medium">Keine Tasks gefunden</p>
        <p className="text-sm text-muted-foreground mt-1">Versuche einen anderen Filter oder leg einen neuen Task an.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground border-b">
              <th className="px-3 py-2 w-8"></th>
              <th className="px-3 py-2 w-8"></th>
              <th className="px-3 py-2 text-left"><SortHeader label="Titel" sortKey="title" /></th>
              <th className="px-3 py-2 text-left hidden md:table-cell"><SortHeader label="Kunde" sortKey="customer_name" /></th>
              <th className="px-3 py-2 text-left hidden lg:table-cell"><SortHeader label="Projekt" sortKey="project_name" /></th>
              <th className="px-3 py-2 text-left"><SortHeader label="Fällig" sortKey="due_date" /></th>
              <th className="px-3 py-2 text-left"><SortHeader label="Prio" sortKey="priority" /></th>
              <th className="px-3 py-2 text-left"><SortHeader label="Status" sortKey="status" /></th>
              <th className="px-3 py-2 text-left hidden md:table-cell"><SortHeader label="Zeit" sortKey="total_minutes" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const isPending = pendingIds.has(task.id);
              const isDone = task.status === "done";
              const isRunningHere = runningTimerTaskId === task.id;
              const due = formatDueDate(task.due_date);
              const isOverdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !isDone;

              return (
                <tr
                  key={task.id}
                  className={cn(
                    "border-b last:border-0 hover:bg-muted/30 transition-colors group",
                    isDone && "opacity-50",
                    isOverdue && "bg-red-50/30 dark:bg-red-950/10"
                  )}
                >
                  {/* Done toggle */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleToggleDone(task)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-green-600 transition-colors disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> :
                        isDone ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                        <Circle className="h-4 w-4" />}
                    </button>
                  </td>

                  {/* Timer */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleTimer(task)}
                      disabled={isPending || isDone}
                      className={cn(
                        "transition-colors disabled:opacity-30",
                        isRunningHere ? "text-red-600 hover:text-red-700" : "text-muted-foreground hover:text-green-600"
                      )}
                      title={isRunningHere ? "Timer stoppen" : "Timer starten"}
                    >
                      {isRunningHere ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    </button>
                  </td>

                  {/* Title */}
                  <td className="px-3 py-2 max-w-[300px]">
                    <Link href={`/tasks/${task.id}`} className="font-medium hover:underline line-clamp-1 flex items-center gap-1.5">
                      {isRunningHere && <Timer className="h-3 w-3 text-amber-500 animate-pulse shrink-0" />}
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">
                    {task.customer_name && (
                      <Link href={`/customers/${task.customer_id}`} className="hover:underline hover:text-foreground line-clamp-1">
                        {task.customer_name}
                      </Link>
                    )}
                  </td>

                  {/* Project */}
                  <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">
                    {task.project_name && (
                      <Link href={`/projects/${task.project_id}`} className="hover:underline hover:text-foreground line-clamp-1">
                        {task.project_name}
                      </Link>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={due.className}>{due.text}</span>
                  </td>

                  {/* Priority (inline edit) */}
                  <td className="px-3 py-2">
                    <Select
                      value={task.priority}
                      onValueChange={(v) => v && handlePriorityChange(task, v as DashboardTask["priority"])}
                      items={Object.fromEntries(PRIORITY_OPTIONS.map((p) => [p.value, p.label]))}
                    >
                      <SelectTrigger className="h-7 px-2 border-0 bg-transparent hover:bg-muted -mx-1.5">
                        <SelectValue>
                          {(value: string) => {
                            const opt = PRIORITY_OPTIONS.find((o) => o.value === value);
                            return opt ? <Badge variant="outline" className={cn("text-xs", opt.color)}>{opt.label}</Badge> : null;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Status (inline edit) */}
                  <td className="px-3 py-2">
                    <Select
                      value={task.status}
                      onValueChange={(v) => v && handleStatusChange(task, v as DashboardTask["status"])}
                      items={Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]))}
                    >
                      <SelectTrigger className="h-7 px-2 border-0 bg-transparent hover:bg-muted -mx-1.5">
                        <SelectValue>
                          {(value: string) => {
                            const opt = STATUS_OPTIONS.find((o) => o.value === value);
                            return opt ? <Badge variant="outline" className={cn("text-xs", opt.color)}>{opt.label}</Badge> : null;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Time */}
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground tabular-nums">
                    {formatMinutes(task.total_minutes)}
                    {task.half_billing && task.total_minutes > 0 && <span className="ml-1 text-violet-600">½</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</span>
        <span>Klick auf Spalte zum Sortieren</span>
      </div>
    </div>
  );
}
