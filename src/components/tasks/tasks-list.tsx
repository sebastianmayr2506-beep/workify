"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskStatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { TaskForm } from "@/components/tasks/task-form";

interface Task {
  id: string;
  title: string;
  status: "open" | "in_progress" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
}

interface Props {
  tasks: Task[];
  customerId: string;
  projectId: string | null;
}

export function TasksList({ tasks, customerId, projectId }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Neuer Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Keine offenen Tasks.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{task.title}</p>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString("de-AT")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Neuer Task</DialogTitle></DialogHeader>
          <TaskForm
            defaultCustomerId={customerId}
            defaultProjectId={projectId}
            onSuccess={() => { setShowForm(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
