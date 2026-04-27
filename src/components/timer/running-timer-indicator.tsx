"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { Timer, Square, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { stopTimer } from "@/lib/actions/time-entries";

interface RunningTimer {
  id: string;
  started_at: string;
  task_id: string;
  task_title: string;
}

interface TimeEntryRow {
  id: string;
  started_at: string;
  task_id: string;
}

function formatElapsed(startedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RunningTimerIndicator() {
  const [timer, setTimer] = useState<RunningTimer | null>(null);
  const [elapsed, setElapsed] = useState("");
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const fetchTimer = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("time_entries")
      .select("id, started_at, task_id")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .maybeSingle() as { data: TimeEntryRow | null; error: unknown };

    if (!data) {
      setTimer(null);
      return;
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("title")
      .eq("id", data.task_id)
      .maybeSingle() as { data: { title: string } | null; error: unknown };

    setTimer({
      id: data.id,
      started_at: data.started_at,
      task_id: data.task_id,
      task_title: task?.title ?? "Unbekannter Task",
    });
  }, [supabase]);

  useEffect(() => {
    fetchTimer();
  }, [fetchTimer]);

  useEffect(() => {
    if (!timer) return;
    setElapsed(formatElapsed(timer.started_at));
    const interval = setInterval(() => {
      setElapsed(formatElapsed(timer.started_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  function handleStop() {
    if (!timer) return;
    startTransition(async () => {
      try {
        await stopTimer(timer.id, timer.task_id);
        setTimer(null);
        toast.success("Timer gestoppt.");
      } catch {
        toast.error("Timer konnte nicht gestoppt werden.");
      }
    });
  }

  if (!timer) return null;

  return (
    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 text-sm">
      <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
      <Link
        href={`/tasks/${timer.task_id}`}
        className="font-medium text-amber-800 dark:text-amber-200 hover:underline truncate max-w-[180px]"
      >
        {timer.task_title}
      </Link>
      <span className="font-mono text-amber-700 dark:text-amber-300 tabular-nums shrink-0">
        {elapsed}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900 shrink-0"
        onClick={handleStop}
        disabled={isPending}
        title="Timer stoppen"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3 fill-current" />}
      </Button>
    </div>
  );
}
