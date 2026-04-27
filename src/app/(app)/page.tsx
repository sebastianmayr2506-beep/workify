import Link from "next/link";
import { AlertCircle, Calendar, Loader, MessageCircle, Play } from "lucide-react";
import { getTasksForToday } from "@/lib/actions/tasks";
import { getOpenQuestionsCount } from "@/lib/actions/questions";
import { getRunningTimer } from "@/lib/actions/time-entries";
import { TodayTaskRow } from "@/components/today/today-task-row";
import { cn } from "@/lib/utils";

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-AT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TodayPage() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [allTasks, openQuestionsCount, runningTimer] = await Promise.all([
    getTasksForToday().catch(() => []),
    getOpenQuestionsCount().catch(() => 0),
    getRunningTimer().catch(() => null),
  ]);

  // Categorize tasks
  const overdueTasks = allTasks.filter(
    (t) => t.due_date && t.due_date < todayStr && t.status !== "done"
  );
  const todayTasks = allTasks.filter(
    (t) => t.due_date === todayStr && t.status !== "done"
  );
  const inProgressTasks = allTasks.filter(
    (t) => t.status === "in_progress" && (!t.due_date || t.due_date > todayStr)
  );
  const waitingTasks = allTasks.filter(
    (t) => t.status === "waiting" && (!t.due_date || t.due_date > todayStr)
  );

  const stats = [
    {
      label: "Überfällig",
      value: overdueTasks.length,
      icon: AlertCircle,
      color: overdueTasks.length > 0 ? "text-red-600" : "text-muted-foreground",
      bg: overdueTasks.length > 0 ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" : "bg-muted/30",
    },
    {
      label: "Heute fällig",
      value: todayTasks.length,
      icon: Calendar,
      color: todayTasks.length > 0 ? "text-amber-600" : "text-muted-foreground",
      bg: todayTasks.length > 0 ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" : "bg-muted/30",
    },
    {
      label: "In Arbeit",
      value: inProgressTasks.length,
      icon: Loader,
      color: "text-blue-600",
      bg: inProgressTasks.length > 0 ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900" : "bg-muted/30",
    },
    {
      label: "Offene Fragen",
      value: openQuestionsCount,
      icon: MessageCircle,
      href: "/questions",
      color: openQuestionsCount > 0 ? "text-violet-600" : "text-muted-foreground",
      bg: openQuestionsCount > 0 ? "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900" : "bg-muted/30",
    },
  ];

  const isEmpty =
    overdueTasks.length === 0 &&
    todayTasks.length === 0 &&
    inProgressTasks.length === 0 &&
    waitingTasks.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Heute</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{formatDate(today)}</p>
      </div>

      {/* Running timer banner */}
      {runningTimer && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
          <Play className="h-4 w-4 text-amber-600 shrink-0 fill-current" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Timer läuft gerade — sieh den Header für Details oder öffne den Task.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const card = (
            <div className={cn("rounded-lg border p-4 flex flex-col gap-1", stat.bg)}>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="hover:opacity-80 transition-opacity">
              {card}
            </Link>
          ) : (
            <div key={stat.label}>{card}</div>
          );
        })}
      </div>

      {/* All clear */}
      {isEmpty && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-medium">Alles erledigt!</p>
          <p className="text-sm text-muted-foreground mt-1">Keine offenen, überfälligen oder wartenden Tasks für heute.</p>
        </div>
      )}

      {/* Sections */}
      {overdueTasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Überfällig ({overdueTasks.length})
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TodayTaskRow
                key={task.id}
                task={{ ...task, customers: (task.customers as { id: string; name: string } | null), projects: (task.projects as { id: string; name: string } | null) }}
                isOverdue
                isRunning={runningTimer?.task_id === task.id}
              />
            ))}
          </div>
        </section>
      )}

      {todayTasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Heute fällig ({todayTasks.length})
          </h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TodayTaskRow
                key={task.id}
                task={{ ...task, customers: (task.customers as { id: string; name: string } | null), projects: (task.projects as { id: string; name: string } | null) }}
                isRunning={runningTimer?.task_id === task.id}
              />
            ))}
          </div>
        </section>
      )}

      {inProgressTasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
            <Loader className="h-4 w-4" />
            In Arbeit ({inProgressTasks.length})
          </h2>
          <div className="space-y-2">
            {inProgressTasks.map((task) => (
              <TodayTaskRow
                key={task.id}
                task={{ ...task, customers: (task.customers as { id: string; name: string } | null), projects: (task.projects as { id: string; name: string } | null) }}
                isRunning={runningTimer?.task_id === task.id}
              />
            ))}
          </div>
        </section>
      )}

      {waitingTasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            Wartend ({waitingTasks.length})
          </h2>
          <div className="space-y-2">
            {waitingTasks.map((task) => (
              <TodayTaskRow
                key={task.id}
                task={{ ...task, customers: (task.customers as { id: string; name: string } | null), projects: (task.projects as { id: string; name: string } | null) }}
                isRunning={runningTimer?.task_id === task.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
