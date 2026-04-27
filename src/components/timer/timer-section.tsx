"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TimerStartStop } from "./timer-start-stop";
import {
  createManualEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from "@/lib/actions/time-entries";

interface TimeEntry {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  note: string | null;
}

interface RunningEntry {
  id: string;
  task_id: string;
  started_at: string;
}

interface Props {
  taskId: string;
  taskTitle: string;
  halfBilling: boolean;
  initialEntries: TimeEntry[];
  initialRunning: RunningEntry | null;
  runningTaskTitle?: string | null;
}

function durationMinutes(started: string, ended: string): number {
  return Math.floor((new Date(ended).getTime() - new Date(started).getTime()) / 60000);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatElapsed(startedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function toLocalDateTimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function TimerSection({ taskId, taskTitle, halfBilling, initialEntries, initialRunning, runningTaskTitle }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [runningEntry, setRunningEntry] = useState<RunningEntry | null>(initialRunning);
  const [elapsed, setElapsed] = useState("");

  // Running timer: only show running entry on THIS task
  const isRunningHere = runningEntry?.task_id === taskId;
  const runningTaskId = runningEntry?.task_id ?? null;
  const runningEntryId = runningEntry?.id ?? null;

  useEffect(() => {
    if (!isRunningHere || !runningEntry) return;
    setElapsed(formatElapsed(runningEntry.started_at));
    const interval = setInterval(() => setElapsed(formatElapsed(runningEntry.started_at)), 1000);
    return () => clearInterval(interval);
  }, [isRunningHere, runningEntry]);

  function handleTimerChange(newEntryId: string | null) {
    if (newEntryId === null) {
      // Stopped — reload entries from DB via revalidation, but optimistically clear
      if (isRunningHere && runningEntry) {
        const ended = new Date().toISOString();
        setEntries((prev) => [
          { id: runningEntry.id, task_id: taskId, started_at: runningEntry.started_at, ended_at: ended, note: null },
          ...prev,
        ]);
      }
      setRunningEntry(null);
    } else {
      setRunningEntry({ id: newEntryId, task_id: taskId, started_at: new Date().toISOString() });
    }
  }

  // Completed entries
  const completedEntries = entries.filter((e) => e.ended_at !== null);
  const totalMinutes = completedEntries.reduce((sum, e) => sum + durationMinutes(e.started_at, e.ended_at!), 0);

  // --- Add/Edit dialog ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [form, setForm] = useState({ started_at: "", ended_at: "", note: "" });
  const [isPending, startTransition] = useTransition();

  function openAddDialog() {
    const now = toLocalDateTimeValue(new Date().toISOString());
    setEditingEntry(null);
    setForm({ started_at: now, ended_at: now, note: "" });
    setDialogOpen(true);
  }

  function openEditDialog(entry: TimeEntry) {
    setEditingEntry(entry);
    setForm({
      started_at: toLocalDateTimeValue(entry.started_at),
      ended_at: entry.ended_at ? toLocalDateTimeValue(entry.ended_at) : "",
      note: entry.note ?? "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    const startedAt = new Date(form.started_at).toISOString();
    const endedAt = new Date(form.ended_at).toISOString();
    if (new Date(endedAt) <= new Date(startedAt)) {
      toast.error("Endzeit muss nach der Startzeit liegen.");
      return;
    }
    startTransition(async () => {
      if (editingEntry) {
        const updated = await updateTimeEntry(editingEntry.id, taskId, {
          started_at: startedAt,
          ended_at: endedAt,
          note: form.note || null,
        });
        setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? { ...e, ...updated } : e)));
        toast.success("Eintrag aktualisiert.");
      } else {
        const created = await createManualEntry(taskId, startedAt, endedAt, form.note || undefined);
        setEntries((prev) => [created as TimeEntry, ...prev]);
        toast.success("Eintrag hinzugefügt.");
      }
      setDialogOpen(false);
    });
  }

  function handleDelete(entry: TimeEntry) {
    startTransition(async () => {
      await deleteTimeEntry(entry.id, taskId);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success("Eintrag gelöscht.");
    });
  }

  return (
    <div className="rounded-lg border">
      {/* Header row with timer button */}
      <div className="flex items-center gap-4 p-4 border-b">
        <TimerStartStop
          taskId={taskId}
          taskTitle={taskTitle}
          runningEntryId={runningEntryId}
          runningTaskId={runningTaskId}
          runningTaskTitle={runningTaskTitle}
          onTimerChange={handleTimerChange}
        />
        <div className="flex-1 min-w-0">
          {isRunningHere ? (
            <>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Timer läuft</p>
              <p className="text-2xl font-mono font-semibold tabular-nums">{elapsed}</p>
            </>
          ) : runningEntry && !isRunningHere ? (
            <p className="text-sm text-muted-foreground">
              Timer läuft für einen anderen Task — hier starten, um zu wechseln.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Kein Timer aktiv — Start drücken.</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Gesamt</p>
          <p className="text-sm font-semibold">{formatDuration(totalMinutes)}</p>
          {halfBilling && totalMinutes > 0 && (
            <p className="text-xs text-violet-600">½ verrechnet</p>
          )}
        </div>
      </div>

      {/* Entries list */}
      <div className="divide-y">
        {completedEntries.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">Noch keine Zeiteinträge.</p>
        )}
        {completedEntries.map((entry) => {
          const mins = durationMinutes(entry.started_at, entry.ended_at!);
          return (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 group">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm">
                  {formatDateTime(entry.started_at)} – {formatDateTime(entry.ended_at!)}
                </span>
                {entry.note && (
                  <span className="ml-2 text-xs text-muted-foreground truncate">{entry.note}</span>
                )}
              </div>
              <span className="text-sm font-medium tabular-nums shrink-0">{formatDuration(mins)}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => openEditDialog(entry)}
                  disabled={isPending}
                  title="Bearbeiten"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(entry)}
                  disabled={isPending}
                  title="Löschen"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: add manual */}
      <div className="px-4 py-2.5 border-t">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={openAddDialog}>
          <Plus className="h-3.5 w-3.5" />
          Eintrag manuell hinzufügen
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Eintrag bearbeiten" : "Eintrag hinzufügen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="started_at">Start</Label>
                <Input
                  id="started_at"
                  type="datetime-local"
                  value={form.started_at}
                  onChange={(e) => setForm((f) => ({ ...f, started_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ended_at">Ende</Label>
                <Input
                  id="ended_at"
                  type="datetime-local"
                  value={form.ended_at}
                  onChange={(e) => setForm((f) => ({ ...f, ended_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Notiz (optional)</Label>
              <Input
                id="note"
                placeholder="z.B. Konzept erstellt"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
