"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Timer } from "lucide-react";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: "open" | "in_progress" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  customers: { id: string; name: string } | null;
  projects: { id: string; name: string } | null;
}

interface Props {
  task: Task;
  isOverdue?: boolean;
  isRunning?: boolean;
}

export function TodayTaskRow({ task, isOverdue, isRunning }: Props) {
  const [status, setStatus] = useState(task.status);
  const [isPending, startTransition] = useTransition();

  function toggleDone() {
    const next = status === "done" ? "open" : "done";
    startTransition(async () => {
      await updateTaskStatus(task.id, next);
      setStatus(next);
      if (next === "done") toast.success("Task erledigt! ✓");
    });
  }

  const isDone = status === "done";

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
      isDone && "opacity-50",
      isOverdue && !isDone && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20",
    )}>
      {/* Done toggle */}
      <button
        onClick={toggleDone}
        disabled={isPending}
        className="shrink-0 text-muted-foreground hover:text-green-600 transition-colors"
        title={isDone ? "Als offen markieren" : "Als erledigt markieren"}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0 group">
        <p className={cn("text-sm font-medium line-clamp-1 group-hover:underline", isDone && "line-through")}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {task.customers && (
            <span className="text-xs text-muted-foreground">{task.customers.name}</span>
          )}
          {task.projects && (
            <>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">{task.projects.name}</span>
            </>
          )}
          {task.due_date && isOverdue && !isDone && (
            <span className="text-xs font-medium text-red-600">
              Fällig seit {new Date(task.due_date).toLocaleDateString("de-AT")}
            </span>
          )}
        </div>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {isRunning && (
          <Timer className="h-4 w-4 text-amber-500 animate-pulse" />
        )}
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}
