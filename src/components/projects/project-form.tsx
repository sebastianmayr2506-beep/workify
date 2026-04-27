"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createProject, updateProject } from "@/lib/actions/projects";

interface Props {
  customerId: string;
  projectId?: string;
  defaultValues?: {
    name?: string;
    description?: string;
    status?: "planned" | "active" | "on_hold" | "done";
  };
  onSuccess?: () => void;
}

export function ProjectForm({ customerId, projectId, defaultValues, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [status, setStatus] = useState<"planned" | "active" | "on_hold" | "done">(defaultValues?.status ?? "active");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (projectId) {
        await updateProject(projectId, { name, description, status });
        toast.success("Projekt gespeichert.");
      } else {
        const project = await createProject({ name, description, status, customer_id: customerId });
        toast.success("Projekt angelegt.");
        router.push(`/projects/${project.id}`);
      }
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Geplant</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="on_hold">Pausiert</SelectItem>
            <SelectItem value="done">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "…" : "Speichern"}</Button>
        {onSuccess && <Button type="button" variant="outline" onClick={onSuccess}>Abbrechen</Button>}
      </div>
    </form>
  );
}
