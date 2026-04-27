"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, Kanban, Folders } from "lucide-react";
import { DashboardStats } from "./dashboard-stats";
import { DashboardFilters, type DashboardFilterState } from "./dashboard-filters";
import { TasksTable } from "./tasks-table";
import { TasksKanban } from "./tasks-kanban";
import { ProjectsKanban } from "./projects-kanban";
import { getAllTasks, getAllProjectsWithStats, type DashboardTask, type DashboardProject } from "@/lib/actions/dashboard";
import { getRunningTimer } from "@/lib/actions/time-entries";
import { cn } from "@/lib/utils";

type View = "table" | "tasks-kanban" | "projects-kanban";

interface CustomerOption { id: string; name: string }
interface ProjectOption { id: string; name: string; customer_id: string }

interface Props {
  initialTasks: DashboardTask[];
  initialProjects: DashboardProject[];
  initialOpenQuestions: number;
  initialRunningTimer: { id: string; task_id: string } | null;
  customers: CustomerOption[];
  allProjects: ProjectOption[];
}

const STORAGE_KEY = "workify-dashboard-view";
const EMPTY_FILTERS: DashboardFilterState = {
  search: "", customerId: "", projectId: "", status: "", priority: "",
};

export function DashboardView({
  initialTasks,
  initialProjects,
  initialOpenQuestions,
  initialRunningTimer,
  customers,
  allProjects,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("table");
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [runningTimer, setRunningTimer] = useState(initialRunningTimer);
  const [filters, setFilters] = useState<DashboardFilterState>(EMPTY_FILTERS);
  const [statFilter, setStatFilter] = useState<"overdue" | "today" | "in_progress" | null>(null);
  const [, startTransition] = useTransition();

  // Load saved view from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as View | null;
    if (saved === "table" || saved === "tasks-kanban" || saved === "projects-kanban") {
      setView(saved);
    }
  }, []);

  function changeView(newView: View) {
    setView(newView);
    localStorage.setItem(STORAGE_KEY, newView);
  }

  // Refresh data after mutations
  function refreshTasks() {
    startTransition(async () => {
      const [t, rt] = await Promise.all([
        getAllTasks({ includeDone: true }).catch(() => []),
        getRunningTimer().catch(() => null),
      ]);
      setTasks(t);
      setRunningTimer(rt);
      router.refresh();
    });
  }

  function refreshProjects() {
    startTransition(async () => {
      const p = await getAllProjectsWithStats().catch(() => []);
      setProjects(p);
      router.refresh();
    });
  }

  // Apply filters + statFilter to tasks
  const today = new Date().toISOString().slice(0, 10);
  const filtered = tasks.filter((t) => {
    if (filters.customerId && t.customer_id !== filters.customerId) return false;
    if (filters.projectId && t.project_id !== filters.projectId) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;

    // Stat-based quick filters (only apply if no manual status filter)
    if (statFilter === "overdue") {
      if (t.status === "done" || !t.due_date || t.due_date >= today) return false;
    } else if (statFilter === "today") {
      if (t.status === "done" || t.due_date !== today) return false;
    } else if (statFilter === "in_progress") {
      if (t.status !== "in_progress") return false;
    }

    return true;
  });

  // Calculate stats from full tasks list (not filtered)
  const overdueCount = tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < today).length;
  const todayCount = tasks.filter((t) => t.status !== "done" && t.due_date === today).length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;

  const views: { key: View; label: string; icon: typeof Table }[] = [
    { key: "table", label: "Tabelle", icon: Table },
    { key: "tasks-kanban", label: "Tasks", icon: Kanban },
    { key: "projects-kanban", label: "Projekte", icon: Folders },
  ];

  return (
    <div className="space-y-4">
      <DashboardStats
        overdueCount={overdueCount}
        todayCount={todayCount}
        inProgressCount={inProgressCount}
        openQuestionsCount={initialOpenQuestions}
        activeFilter={statFilter}
        onFilterClick={setStatFilter}
      />

      {/* View toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.key}
                onClick={() => changeView(v.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  view === v.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters (not for projects view) */}
      {view !== "projects-kanban" && (
        <DashboardFilters
          filters={filters}
          onChange={setFilters}
          customers={customers}
          projects={allProjects}
        />
      )}

      {/* Content */}
      {view === "table" && (
        <TasksTable
          tasks={filtered}
          runningTimerTaskId={runningTimer?.task_id ?? null}
          runningTimerEntryId={runningTimer?.id ?? null}
          onTimerChange={refreshTasks}
        />
      )}
      {view === "tasks-kanban" && (
        <TasksKanban
          tasks={filtered}
          runningTimerTaskId={runningTimer?.task_id ?? null}
          onTaskMoved={refreshTasks}
        />
      )}
      {view === "projects-kanban" && (
        <ProjectsKanban projects={projects} onProjectMoved={refreshProjects} />
      )}
    </div>
  );
}
