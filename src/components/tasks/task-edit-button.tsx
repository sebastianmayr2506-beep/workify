"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/tasks/task-form";

interface Task {
  id: string;
  title: string;
  description: string | null;
  customer_id: string;
  project_id: string | null;
  status: "open" | "in_progress" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  half_billing: boolean;
}

export function TaskEditButton({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4 mr-1.5" />Bearbeiten
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Task bearbeiten</DialogTitle></DialogHeader>
          <TaskForm
            taskId={task.id}
            defaultCustomerId={task.customer_id}
            defaultProjectId={task.project_id}
            defaultValues={{
              title: task.title,
              description: task.description ?? undefined,
              customer_id: task.customer_id,
              project_id: task.project_id,
              status: task.status,
              priority: task.priority,
              due_date: task.due_date,
              half_billing: task.half_billing,
            }}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
