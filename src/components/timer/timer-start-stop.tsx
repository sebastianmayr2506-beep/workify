"use client";

import { useState, useTransition } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { startTimer, stopTimer, stopAndStartTimer } from "@/lib/actions/time-entries";

interface Props {
  taskId: string;
  taskTitle: string;
  runningEntryId: string | null;
  runningTaskId: string | null;
  runningTaskTitle?: string | null;
  onTimerChange: (entryId: string | null) => void;
}

export function TimerStartStop({
  taskId,
  taskTitle,
  runningEntryId,
  runningTaskId,
  runningTaskTitle,
  onTimerChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<{ entryId: string; taskId: string } | null>(null);

  const isRunningOnThisTask = runningTaskId === taskId && runningEntryId !== null;

  function handleStart() {
    startTransition(async () => {
      const result = await startTimer(taskId);
      if (result.conflict) {
        setPendingConflict({ entryId: result.runningEntryId!, taskId: result.runningTaskId! });
        setConflictOpen(true);
      } else {
        onTimerChange(result.entry?.id ?? null);
        toast.success("Timer gestartet.");
      }
    });
  }

  function handleStop() {
    if (!runningEntryId) return;
    startTransition(async () => {
      await stopTimer(runningEntryId, taskId);
      onTimerChange(null);
      toast.success("Timer gestoppt.");
    });
  }

  function handleConflictStopAndStart() {
    if (!pendingConflict) return;
    setConflictOpen(false);
    startTransition(async () => {
      const entry = await stopAndStartTimer(pendingConflict.entryId, pendingConflict.taskId, taskId);
      onTimerChange(entry?.id ?? null);
      toast.success("Timer gewechselt.");
      setPendingConflict(null);
    });
  }

  function handleConflictCancel() {
    setConflictOpen(false);
    setPendingConflict(null);
  }

  return (
    <>
      {isRunningOnThisTask ? (
        <Button
          variant="destructive"
          size="lg"
          className="h-14 w-14 rounded-full p-0 shrink-0"
          onClick={handleStop}
          disabled={isPending}
          title="Timer stoppen"
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Square className="h-6 w-6 fill-current" />
          )}
        </Button>
      ) : (
        <Button
          variant="default"
          size="lg"
          className="h-14 w-14 rounded-full p-0 shrink-0 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleStart}
          disabled={isPending}
          title="Timer starten"
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Play className="h-6 w-6 fill-current ml-0.5" />
          )}
        </Button>
      )}

      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Timer läuft bereits</DialogTitle>
            <DialogDescription>
              Es läuft bereits ein Timer für{" "}
              <span className="font-medium text-foreground">
                {runningTaskTitle ?? "einen anderen Task"}
              </span>
              . Möchtest du diesen stoppen und den Timer für{" "}
              <span className="font-medium text-foreground">{taskTitle}</span> starten?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleConflictCancel}>
              Abbrechen
            </Button>
            <Button onClick={handleConflictStopAndStart} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Timer wechseln
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
