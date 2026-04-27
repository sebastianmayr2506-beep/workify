"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload, X, Loader2, CheckCircle2, AlertCircle, ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { extractTasksFromText, extractTasksFromImage, type ExtractedTask } from "@/lib/actions/ai-import";
import { createTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

interface CustomerOption { id: string; name: string }
interface ProjectOption { id: string; name: string }

interface Props {
  customers: CustomerOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "input" | "review";

const PRIORITY_LABELS: Record<ExtractedTask["priority"], string> = {
  low: "Niedrig", medium: "Mittel", high: "Hoch", urgent: "Dringend",
};
const PRIORITY_COLORS: Record<ExtractedTask["priority"], string> = {
  low: "text-slate-600 border-slate-200 bg-slate-50",
  medium: "text-blue-600 border-blue-200 bg-blue-50",
  high: "text-amber-600 border-amber-200 bg-amber-50",
  urgent: "text-red-600 border-red-200 bg-red-50",
};

export function AiImportDialog({ customers, open, onOpenChange }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extraContext, setExtraContext] = useState("");
  const [extracted, setExtracted] = useState<ExtractedTask[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [editedTasks, setEditedTasks] = useState<ExtractedTask[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep("input");
      setText("");
      setImageFile(null);
      setImagePreview(null);
      setExtraContext("");
      setExtracted([]);
      setSelected([]);
      setEditedTasks([]);
      setCustomerId("");
      setProjectId("");
      setError(null);
    }, 300);
  }

  function handleImageSelect(file: File) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleImageSelect(file);
  }

  async function loadProjects(cId: string) {
    if (!cId) { setProjects([]); setProjectId(""); return; }
    setLoadingProjects(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("projects").select("id, name").eq("customer_id", cId).eq("user_id", user.id).order("name");
      setProjects((data as ProjectOption[]) ?? []);
      setProjectId("");
    } finally {
      setLoadingProjects(false);
    }
  }

  function handleAnalyze() {
    setError(null);
    startTransition(async () => {
      try {
        let tasks: ExtractedTask[];
        if (mode === "image" && imageFile) {
          const base64 = await fileToBase64(imageFile);
          tasks = await extractTasksFromImage(base64, "image/jpeg", extraContext || undefined);
        } else {
          if (!text.trim()) { setError("Bitte Text eingeben."); return; }
          tasks = await extractTasksFromText(text.trim());
        }
        if (tasks.length === 0) {
          setError("Keine Aufgaben gefunden. Versuche es mit mehr Details.");
          return;
        }
        setExtracted(tasks);
        setEditedTasks(tasks.map((t) => ({ ...t })));
        setSelected(tasks.map(() => true));
        setStep("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler bei der Analyse.");
      }
    });
  }

  async function handleCreate() {
    if (!customerId) { toast.error("Bitte einen Kunden auswählen."); return; }
    const toCreate = editedTasks.filter((_, i) => selected[i]);
    if (toCreate.length === 0) { toast.error("Kein Task ausgewählt."); return; }
    setCreating(true);
    try {
      for (const task of toCreate) {
        await createTask({
          title: task.title,
          description: task.description || undefined,
          customer_id: customerId,
          project_id: projectId || null,
          priority: task.priority,
          source: "ai_import",
        } as Parameters<typeof createTask>[0]);
      }
      toast.success(`${toCreate.length} Task${toCreate.length > 1 ? "s" : ""} erstellt.`);
      router.refresh();
      handleClose();
    } catch {
      toast.error("Fehler beim Erstellen der Tasks.");
    } finally {
      setCreating(false);
    }
  }

  function updateTask(i: number, updates: Partial<ExtractedTask>) {
    setEditedTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, ...updates } : t));
  }

  const selectedCount = selected.filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            KI-Import
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
              <button
                onClick={() => setMode("text")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", mode === "text" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <FileText className="h-4 w-4" />Text
              </button>
              <button
                onClick={() => setMode("image")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", mode === "image" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <ImageIcon className="h-4 w-4" />Screenshot
              </button>
            </div>

            {mode === "text" ? (
              <div className="space-y-1.5">
                <Label htmlFor="ai-text">Text einfügen</Label>
                <Textarea
                  id="ai-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="E-Mail, Slack-Nachricht, Meeting-Notizen, Ticket-Beschreibung … einfach einfügen."
                  rows={8}
                  autoFocus
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Die KI extrahiert alle umsetzbaren Aufgaben automatisch.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-muted/50",
                    imagePreview ? "border-violet-300" : "border-muted-foreground/30"
                  )}
                >
                  {imagePreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Vorschau" className="max-h-48 mx-auto rounded object-contain" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                        className="absolute top-0 right-0 bg-background border rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">{imageFile?.name}</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium">Screenshot hier ablegen</p>
                      <p className="text-xs text-muted-foreground mt-1">oder klicken zum Auswählen — PNG, JPG, WebP</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="extra-context">Zusätzlicher Kontext (optional)</Label>
                  <Input
                    id="extra-context"
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    placeholder="z.B. Das ist ein Jira-Board für Projekt X …"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
              <Button
                onClick={handleAnalyze}
                disabled={isPending || (mode === "text" ? !text.trim() : !imageFile)}
                className="gap-2"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isPending ? "Analysiere …" : "Analysieren"}
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{extracted.length} Aufgabe{extracted.length !== 1 ? "n" : ""}</span> gefunden — prüfe und bearbeite sie vor dem Erstellen.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setStep("input")} className="text-xs">
                ← Zurück
              </Button>
            </div>

            {/* Task review list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {editedTasks.map((task, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-3 space-y-2 transition-opacity",
                    !selected[i] && "opacity-40"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => setSelected((prev) => prev.map((v, idx) => idx === i ? !v : v))}
                      className="mt-0.5 shrink-0"
                    >
                      <CheckCircle2 className={cn("h-5 w-5 transition-colors", selected[i] ? "text-green-600" : "text-muted-foreground/40")} />
                    </button>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={task.title}
                        onChange={(e) => updateTask(i, { title: e.target.value })}
                        className="font-medium h-8 text-sm"
                      />
                      <Textarea
                        value={task.description}
                        onChange={(e) => updateTask(i, { description: e.target.value })}
                        rows={2}
                        className="text-xs resize-none"
                        placeholder="Beschreibung (optional)"
                      />
                      <Select
                        value={task.priority}
                        onValueChange={(v) => v && updateTask(i, { priority: v as ExtractedTask["priority"] })}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["low", "medium", "high", "urgent"] as const).map((p) => (
                            <SelectItem key={p} value={p}>
                              <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[p])}>
                                {PRIORITY_LABELS[p]}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer / project selection */}
            <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ziel</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Kunde *</Label>
                  <Select
                    value={customerId}
                    onValueChange={(v) => { if (v) { setCustomerId(v); loadProjects(v); } }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Kunde wählen …" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Projekt (optional)</Label>
                  <Select
                    value={projectId}
                    onValueChange={(v) => setProjectId(v ?? "")}
                    disabled={!customerId || loadingProjects || projects.length === 0}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingProjects ? "Lädt …" : projects.length === 0 ? "Kein Projekt" : "Projekt wählen"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Kein Projekt</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-muted-foreground">
                {selectedCount} von {editedTasks.length} ausgewählt
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || selectedCount === 0 || !customerId}
                  className="gap-2"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {creating ? "Erstelle …" : `${selectedCount} Task${selectedCount !== 1 ? "s" : ""} erstellen`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper: compress + resize image, return base64 without data URL prefix
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

// Legacy helper kept for reference (unused)
function _fileToBase64Raw(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
