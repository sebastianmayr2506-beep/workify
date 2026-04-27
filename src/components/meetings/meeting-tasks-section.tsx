"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { addTaskToMeeting, removeTaskFromMeeting } from "@/lib/actions/meetings";
import { createClient } from "@/lib/supabase/client";

interface Task {
  id: string;
  title: string;
  status: string;
}

interface Props {
  meetingId: string;
  customerId: string;
  tasks: Task[];
}

export function MeetingTasksSection({ meetingId, customerId, tasks: initialTasks }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!showPicker) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("tasks").select("id, title, status").eq("customer_id", customerId).eq("user_id", user.id).neq("status", "done").order("title")
        .then(({ data }) => {
          const linked = new Set(tasks.map((t) => t.id));
          setAvailableTasks(((data as Task[]) ?? []).filter((t) => !linked.has(t.id)));
        });
    });
  }, [showPicker, customerId, tasks]);

  async function handleAdd(task: Task) {
    try {
      await addTaskToMeeting(meetingId, task.id);
      setTasks((prev) => [...prev, task]);
      setAvailableTasks((prev) => prev.filter((t) => t.id !== task.id));
      router.refresh();
    } catch {
      toast.error("Fehler.");
    }
  }

  async function handleRemove(taskId: string) {
    try {
      await removeTaskFromMeeting(meetingId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      router.refresh();
    } catch {
      toast.error("Fehler.");
    }
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 rounded-lg border p-3">
          <Link href={`/tasks/${task.id}`} className="flex-1 text-sm font-medium hover:underline line-clamp-1">
            {task.title}
          </Link>
          <TaskStatusBadge status={task.status as "open" | "in_progress" | "waiting" | "done"} />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(task.id)}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}

      {showPicker && (
        <div className="rounded-lg border p-3 space-y-1 bg-muted/30">
          {availableTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">Keine weiteren Tasks.</p>
          ) : (
            availableTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleAdd(task)}
                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
              >
                {task.title}
              </button>
            ))
          )}
          <Button size="sm" variant="ghost" className="w-full" onClick={() => setShowPicker(false)}>Schließen</Button>
        </div>
      )}

      {!showPicker && (
        <Button variant="outline" size="sm" onClick={() => setShowPicker(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Task verknüpfen
        </Button>
      )}
    </div>
  );
}
