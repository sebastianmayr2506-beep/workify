"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Calendar, AlertCircle, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateProjectStatus } from "@/lib/actions/dashboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DashboardProject } from "@/lib/actions/dashboard";

interface Props {
  projects: DashboardProject[];
  onProjectMoved: () => void;
}

const COLUMNS = [
  { key: "planned" as const, label: "Geplant", color: "bg-slate-50 dark:bg-slate-900/40 border-slate-200" },
  { key: "active" as const, label: "Aktiv", color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200" },
  { key: "on_hold" as const, label: "On Hold", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200" },
  { key: "done" as const, label: "Erledigt", color: "bg-green-50 dark:bg-green-950/30 border-green-200" },
] as const;

function ProjectCard({ project }: { project: DashboardProject }) {
  const progress = project.total_tasks > 0
    ? Math.round((project.done_tasks / project.total_tasks) * 100)
    : 0;
  const today = new Date().toISOString().slice(0, 10);
  const nextDueText = project.next_due_date
    ? new Date(project.next_due_date).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : null;
  const nextDueOverdue = project.next_due_date && project.next_due_date < today;

  return (
    <div className="rounded-lg border bg-background p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow space-y-2">
      <div className="flex items-start gap-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-2 leading-tight">{project.name}</p>
          {project.customer_name && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.customer_name}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {project.total_tasks > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{project.done_tasks}/{project.total_tasks} Tasks</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {project.open_tasks > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 h-5">
            {project.open_tasks} offen
          </Badge>
        )}
        {project.overdue_tasks > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 h-5 text-red-600 border-red-200 bg-red-50 gap-1">
            <AlertCircle className="h-2.5 w-2.5" />
            {project.overdue_tasks} überfällig
          </Badge>
        )}
        {nextDueText && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 h-5 gap-1",
              nextDueOverdue ? "text-red-600 border-red-200 bg-red-50" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-2.5 w-2.5" />{nextDueText}
          </Badge>
        )}
        {project.total_tasks === 0 && (
          <span className="text-[10px] text-muted-foreground italic">Keine Tasks</span>
        )}
      </div>
    </div>
  );
}

function DraggableProject({ project }: { project: DashboardProject }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id, data: project });
  return (
    <Link
      href={`/projects/${project.id}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("block touch-none", isDragging && "opacity-30")}
      onClick={(e) => { if (isDragging) e.preventDefault(); }}
    >
      <ProjectCard project={project} />
    </Link>
  );
}

function Column({ column, projects }: { column: typeof COLUMNS[number]; projects: DashboardProject[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
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
        <span className="text-xs text-muted-foreground">{projects.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {projects.map((p) => <DraggableProject key={p.id} project={p} />)}
        {projects.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-6 italic">Leer</p>
        )}
      </div>
    </div>
  );
}

export function ProjectsKanban({ projects, onProjectMoved }: Props) {
  const [activeProject, setActiveProject] = useState<DashboardProject | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(e: DragStartEvent) {
    setActiveProject(e.active.data.current as DashboardProject);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveProject(null);
    const { active, over } = e;
    if (!over) return;
    const projectId = active.id as string;
    const newStatus = over.id as DashboardProject["status"];
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.status === newStatus) return;

    startTransition(async () => {
      try {
        await updateProjectStatus(projectId, newStatus);
        toast.success(`→ ${COLUMNS.find((c) => c.key === newStatus)?.label}`);
        onProjectMoved();
      } catch {
        toast.error("Fehler beim Verschieben.");
      }
    });
  }

  const grouped = COLUMNS.reduce<Record<string, DashboardProject[]>>((acc, col) => {
    acc[col.key] = projects.filter((p) => p.status === col.key);
    return acc;
  }, {});

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="font-medium">Noch keine Projekte</p>
        <p className="text-sm text-muted-foreground mt-1">Lege ein Projekt unter einem Kunden an.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <Column key={col.key} column={col} projects={grouped[col.key] ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeProject && <div className="rotate-2 cursor-grabbing"><ProjectCard project={activeProject} /></div>}
      </DragOverlay>
    </DndContext>
  );
}
