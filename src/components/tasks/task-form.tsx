"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerCombobox } from "@/components/shared/customer-combobox";
import { toast } from "sonner";
import { createTask, updateTask } from "@/lib/actions/tasks";
import { createClient } from "@/lib/supabase/client";

interface Props {
  taskId?: string;
  defaultCustomerId?: string | null;
  defaultProjectId?: string | null;
  defaultValues?: {
    title?: string;
    description?: string;
    status?: "open" | "in_progress" | "waiting" | "done";
    priority?: "low" | "medium" | "high" | "urgent";
    due_date?: string | null;
    half_billing?: boolean;
    customer_id?: string;
    project_id?: string | null;
  };
  onSuccess?: () => void;
}

interface CustomerOption { id: string; name: string }
interface ProjectOption { id: string; name: string }

export function TaskForm({ taskId, defaultCustomerId, defaultProjectId, defaultValues, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [customerId, setCustomerId] = useState(defaultValues?.customer_id ?? defaultCustomerId ?? "");
  const [projectId, setProjectId] = useState<string>(defaultValues?.project_id ?? defaultProjectId ?? "");
  const [status, setStatus] = useState(defaultValues?.status ?? "open");
  const [priority, setPriority] = useState(defaultValues?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(defaultValues?.due_date ?? "");
  const [halfBilling, setHalfBilling] = useState(defaultValues?.half_billing ?? false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("customers").select("id, name").eq("user_id", user.id).eq("is_archived", false).order("name")
        .then(({ data }) => setCustomers((data as CustomerOption[]) ?? []));
    });
  }, []);

  useEffect(() => {
    if (!customerId) { setProjects([]); setProjectId(""); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("projects").select("id, name").eq("customer_id", customerId).eq("user_id", user.id).order("name")
        .then(({ data }) => setProjects((data as ProjectOption[]) ?? []));
    });
  }, [customerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !customerId) return;
    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description || undefined,
        customer_id: customerId,
        project_id: projectId || null,
        status: status as "open" | "in_progress" | "waiting" | "done",
        priority: priority as "low" | "medium" | "high" | "urgent",
        due_date: dueDate || null,
        half_billing: halfBilling,
      };
      if (taskId) {
        await updateTask(taskId, data);
        toast.success("Task gespeichert.");
        router.refresh();
      } else {
        const task = await createTask(data);
        toast.success("Task angelegt.");
        router.push(`/tasks/${task.id}`);
      }
      onSuccess?.();
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
      </div>

      <div className="space-y-2">
        <Label>Kunde *</Label>
        <CustomerCombobox customers={customers} value={customerId} onChange={setCustomerId} disabled={!!defaultCustomerId} />
      </div>

      {projects.length > 0 && (
        <div className="space-y-2">
          <Label>Projekt</Label>
          <Select
            value={projectId}
            onValueChange={(v) => setProjectId(v ?? "")}
            items={{ "": "Kein Projekt", ...Object.fromEntries(projects.map((p) => [p.id, p.name])) }}
          >
            <SelectTrigger><SelectValue placeholder="Kein Projekt" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Kein Projekt</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => v && setStatus(v as typeof status)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="in_progress">In Arbeit</SelectItem>
              <SelectItem value="waiting">Wartet</SelectItem>
              <SelectItem value="done">Erledigt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priorität</Label>
          <Select value={priority} onValueChange={(v) => v && setPriority(v as typeof priority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Niedrig</SelectItem>
              <SelectItem value="medium">Mittel</SelectItem>
              <SelectItem value="high">Hoch</SelectItem>
              <SelectItem value="urgent">Dringend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due-date">Fällig am</Label>
        <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={halfBilling} onChange={(e) => setHalfBilling(e.target.checked)} className="h-4 w-4 rounded" />
        Halb verrechnen
      </label>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "…" : "Speichern"}</Button>
        {onSuccess && <Button type="button" variant="outline" onClick={onSuccess}>Abbrechen</Button>}
      </div>
    </form>
  );
}
