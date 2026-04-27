"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Calendar, Timer, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DashboardTask } from "@/lib/actions/dashboard";

interface Props {
  tasks: DashboardTask[];
  runningTimerTaskId: string | null;
  onTaskMoved: () => void;
}

const COLUMNS = [
  { key: "open" as const, label: "Offen", color: "bg-slate-50 dark:bg-slate-900/40 border-slate-200" },
  { key: "in_progress" as const, label: "In Arbeit", color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200" },
  { key: "waiting" as const, label: "Wartet", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200" },
  { key: "done" as const, label: "Erledigt", color: "bg-green-50 dark:bg-green-950/30 border-green-200" },
] as const;

const PRIO_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-400",
  low: "bg-slate-300",
};

function TaskCard({ task, isRunning }: { task: DashboardTask; isRunning: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.due_date && task.due_date < today && task.status !== "done";

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow",
        isOverdue && "border-red-300 dark:border-red-800"
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", PRIO_DOT[task.priority])} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2 leading-tight">{task.title}</p>
          {task.customer_name && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {task.customer_name}
              {task.project_name ? ` / ${task.project_name}` : ""}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {task.due_date && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] gap-1 px-1.5 h-5",
                  isOverdue ? "text-red-600 border-red-200 bg-red-50" : "text-muted-foreground"
                )}
              >
                {isOverdue ? <AlertCircle className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5" />}
                {new Date(task.due_date).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" })}
              </Badge>
            )}
            {isRunning && (
              <Badge variant="outline" className="text-[10px] gap-1 px-1.5 h-5 text-amber-600 border-amber-200 bg-amber-50">
                <Timer className="h-2.5 w-2.5 animate-pulse" />Läuft
              </Badge>
            )}
            {task.half_billing && (
              <Badge variant="outline" className="text-[10px] px-1.5 h-5 text-violet-600 border-violet-200 bg-violet-50">½</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableTask({ task, isRunning }: { task: DashboardTask; isRunning: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: task });
  return (
    <Link
      href={`/tasks/${task.id}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("block touch-none", isDragging && "opacity-30")}
      onClick={(e) => {
        // Prevent navigation if user was actually dragging
        // dnd-kit attaches data-dragging during drag
        if (isDragging) e.preventDefault();
      }}
    >
      <TaskCard task={task} isRunning={isRunning} />
    </Link>
  );
}

function Column({
  column,
  tasks,
  runningTimerTaskId,
}: {
  column: typeof COLUMNS[number];
  tasks: DashboardTask[];
  runningTimerTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  // For the "Done" column, only show last 7 days
  const filtered = column.key === "done"
    ? tasks.slice(0, 30)
    : tasks;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border-2 p-2 min-h-[400px] transition-colors",
        column.color,
        isOver && "ring-2 ring-foreground/30 border-foreground/40"
      )}
    >
      <div className="flex items-center justify-between px-1.5 py-1 mb-2">
        <h3 className="font-semibold text-sm">{column.label}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {filtered.map((task) => (
          <DraggableTask key={task.id} task={task} isRunning={runningTimerTaskId === task.id} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-6 italic">Leer</p>
        )}
        {column.key === "done" && tasks.length > 30 && (
          <p className="text-xs text-muted-foreground text-center py-2 italic">+ {tasks.length - 30} ältere</p>
        )}
      </div>
    </div>
  );
}

export function TasksKanban({ tasks, runningTimerTaskId, onTaskMoved }: Props) {
  const [activeTask, setActiveTask] = useState<DashboardTask | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveTask(e.active.data.current as DashboardTask);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as DashboardTask["status"];
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, newStatus);
        toast.success(`→ ${COLUMNS.find((c) => c.key === newStatus)?.label}`);
        onTaskMoved();
      } catch {
        toast.error("Fehler beim Verschieben.");
      }
    });
  }

  const grouped = COLUMNS.reduce<Record<string, DashboardTask[]>>((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <Column key={col.key} column={col} tasks={grouped[col.key] ?? []} runningTimerTaskId={runningTimerTaskId} />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <div className="rotate-2 cursor-grabbing"><TaskCard task={activeTask} isRunning={false} /></div>}
      </DragOverlay>
    </DndContext>
  );
}
