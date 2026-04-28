import Link from "next/link";
import { notFound } from "next/navigation";
import { getTask } from "@/lib/actions/tasks";
import { getNotesByTask } from "@/lib/actions/notes";
import { getQuestionsByTask } from "@/lib/actions/questions";
import { getTimeEntriesByTask, getRunningTimer } from "@/lib/actions/time-entries";
import { getChecklistByTask } from "@/lib/actions/checklist";
import { Checklist } from "@/components/checklist/checklist";
import { TaskStatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { TaskEditButton } from "@/components/tasks/task-edit-button";
import { NotesList } from "@/components/notes/notes-list";
import { QuestionsList } from "@/components/questions/questions-list";
import { TimerSection } from "@/components/timer/timer-section";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [task, notes, questions, timeEntries, runningTimer, checklist] = await Promise.all([
    getTask(id).catch(() => null),
    getNotesByTask(id).catch(() => []),
    getQuestionsByTask(id).catch(() => []),
    getTimeEntriesByTask(id).catch(() => []),
    getRunningTimer().catch(() => null),
    getChecklistByTask(id).catch(() => []),
  ]);

  if (!task) notFound();

  const customer = task.customers as { id: string; name: string; primary_contact_name: string | null } | null;
  const project = task.projects as { id: string; name: string } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1 flex-wrap">
            <Link href="/customers" className="hover:underline">Kunden</Link>
            <span>/</span>
            {customer && <Link href={`/customers/${customer.id}`} className="hover:underline">{customer.name}</Link>}
            {project && (
              <>
                <span>/</span>
                <Link href={`/projects/${project.id}`} className="hover:underline">{project.name}</Link>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight">{task.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.due_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString("de-AT")}
              </span>
            )}
            {task.half_billing && (
              <Badge variant="outline" className="text-xs text-violet-700 border-violet-200 bg-violet-50">
                ½ verrechnen
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TaskStatusSelect taskId={id} currentStatus={task.status} />
          <TaskEditButton task={task} />
        </div>
      </div>

      {task.description && (
        <div className="rounded-lg border p-4">
          <p className="text-sm whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* Checklist */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Schritte</h2>
        <Checklist taskId={id} initialItems={checklist} />
      </section>

      {/* Time Tracking */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Zeiterfassung</h2>
        <TimerSection
          taskId={id}
          taskTitle={task.title}
          halfBilling={task.half_billing}
          initialEntries={timeEntries}
          initialRunning={runningTimer}
        />
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Notizen</h2>
        <NotesList notes={notes} taskId={id} />
      </section>

      {/* Questions */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Fragen</h2>
        <QuestionsList
          questions={questions}
          customerId={task.customer_id}
          taskId={id}
          context="task"
          primaryContactName={customer?.primary_contact_name}
        />
      </section>
    </div>
  );
}
