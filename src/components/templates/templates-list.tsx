"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Play, Loader2, MoreHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TaskForm } from "@/components/tasks/task-form";
import { createTemplate, updateTemplate, deleteTemplate } from "@/lib/actions/templates";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/shared/priority-badge";

interface Template {
  id: string;
  name: string;
  default_title: string | null;
  default_description: string | null;
  default_priority: "low" | "medium" | "high" | "urgent" | null;
  default_customer_id: string | null;
  default_project_id: string | null;
  customers: { id: string; name: string } | null;
  projects: { id: string; name: string } | null;
}

interface CustomerOption { id: string; name: string }

interface Props {
  templates: Template[];
}

type FormState = {
  name: string;
  default_title: string;
  default_description: string;
  default_priority: string;
  default_customer_id: string;
  default_project_id: string;
};

const emptyForm: FormState = {
  name: "",
  default_title: "",
  default_description: "",
  default_priority: "",
  default_customer_id: "",
  default_project_id: "",
};

export function TemplatesList({ templates: initialTemplates }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isPending, startTransition] = useTransition();

  // Template edit/create dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [projects, setProjects] = useState<CustomerOption[]>([]);

  // Task creation from template dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("customers").select("id, name").eq("user_id", user.id).eq("is_archived", false).order("name")
        .then(({ data }) => setCustomers((data as CustomerOption[]) ?? []));
    });
  }, []);

  useEffect(() => {
    if (!form.default_customer_id) { setProjects([]); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("projects").select("id, name").eq("customer_id", form.default_customer_id).eq("user_id", user.id).order("name")
        .then(({ data }) => setProjects((data as CustomerOption[]) ?? []));
    });
  }, [form.default_customer_id]);

  function openCreateDialog() {
    setEditingTemplate(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditDialog(t: Template) {
    setEditingTemplate(t);
    setForm({
      name: t.name,
      default_title: t.default_title ?? "",
      default_description: t.default_description ?? "",
      default_priority: t.default_priority ?? "",
      default_customer_id: t.default_customer_id ?? "",
      default_project_id: t.default_project_id ?? "",
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        default_title: form.default_title || null,
        default_description: form.default_description || null,
        default_priority: (form.default_priority as Template["default_priority"]) || null,
        default_customer_id: form.default_customer_id || null,
        default_project_id: form.default_project_id || null,
      };
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, payload);
        toast.success("Template gespeichert.");
      } else {
        await createTemplate(payload);
        toast.success("Template angelegt.");
      }
      setFormOpen(false);
      router.refresh();
    });
  }

  function handleDelete(t: Template) {
    startTransition(async () => {
      await deleteTemplate(t.id);
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Template gelöscht.");
    });
  }

  function openTaskDialog(t: Template) {
    setSelectedTemplate(t);
    setTaskDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-1.5" />Neues Template
        </Button>
      </div>

      {templates.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">Noch keine Templates</p>
          <p className="text-sm text-muted-foreground mt-1">Lege Templates an, um Tasks schnell aus Vorlagen zu erstellen.</p>
          <Button size="sm" className="mt-4" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1.5" />Erstes Template anlegen
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border p-4 space-y-3 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{t.name}</p>
                {t.customers && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t.customers.name}{t.projects ? ` / ${t.projects.name}` : ""}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(t)}>
                    <Pencil className="h-4 w-4 mr-2" />Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(t)} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Details */}
            <div className="space-y-1 text-xs text-muted-foreground flex-1">
              {t.default_title && <p>Titel: <span className="text-foreground">{t.default_title}</span></p>}
              {t.default_priority && (
                <div className="flex items-center gap-1">Priorität: <PriorityBadge priority={t.default_priority} /></div>
              )}
              {t.default_description && (
                <p className="line-clamp-2 text-muted-foreground/80 italic">{t.default_description}</p>
              )}
            </div>

            <Button size="sm" className="w-full gap-1.5" onClick={() => openTaskDialog(t)}>
              <Play className="h-3.5 w-3.5 fill-current" />Task erstellen
            </Button>
          </div>
        ))}
      </div>

      {/* Template form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Template bearbeiten" : "Neues Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Template-Name *</Label>
              <Input id="tpl-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="z.B. Monatsbericht, Onboarding …" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-title">Standardtitel</Label>
              <Input id="tpl-title" value={form.default_title} onChange={(e) => setForm((f) => ({ ...f, default_title: e.target.value }))} placeholder="Wird als Titel im neuen Task vorausgefüllt" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc">Standardbeschreibung</Label>
              <Textarea id="tpl-desc" value={form.default_description} onChange={(e) => setForm((f) => ({ ...f, default_description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Standardpriorität</Label>
              <Select value={form.default_priority} onValueChange={(v) => setForm((f) => ({ ...f, default_priority: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Keine" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keine</SelectItem>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Standard-Kunde</Label>
              <Select value={form.default_customer_id} onValueChange={(v) => setForm((f) => ({ ...f, default_customer_id: v ?? "", default_project_id: "" }))}>
                <SelectTrigger><SelectValue placeholder="Keiner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keiner</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Standard-Projekt</Label>
                <Select value={form.default_project_id} onValueChange={(v) => setForm((f) => ({ ...f, default_project_id: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Kein Projekt" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Kein Projekt</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task from template dialog */}
      {selectedTemplate && (
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Task aus Template: {selectedTemplate.name}</DialogTitle>
            </DialogHeader>
            <TaskForm
              defaultCustomerId={selectedTemplate.default_customer_id ?? undefined}
              defaultProjectId={selectedTemplate.default_project_id ?? undefined}
              defaultValues={{
                title: selectedTemplate.default_title ?? "",
                description: selectedTemplate.default_description ?? "",
                priority: selectedTemplate.default_priority ?? "medium",
                customer_id: selectedTemplate.default_customer_id ?? undefined,
                project_id: selectedTemplate.default_project_id ?? null,
              }}
              onSuccess={() => setTaskDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
