"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MessageCircle, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createQuestion, updateQuestion } from "@/lib/actions/questions";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  direction: "internal" | "customer";
  assigned_to: string | null;
  status: "open" | "answered" | "wont_answer";
  ask_at_next_meeting: boolean;
  task_id: string | null;
  tasks?: { title: string } | null;
}

interface Props {
  questions: Question[];
  customerId: string;
  taskId?: string;
  context: "customer" | "task";
  primaryContactName?: string | null;
}

export function QuestionsList({ questions, customerId, taskId, context, primaryContactName }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState(primaryContactName ?? "");
  const [newDirection, setNewDirection] = useState<"internal" | "customer">("customer");
  const [addingLoading, setAddingLoading] = useState(false);

  async function handleAnswer(id: string) {
    setSaving(true);
    try {
      await updateQuestion(id, { answer: answerText, status: "answered" });
      toast.success("Antwort gespeichert.");
      setAnsweringId(null);
      setAnswerText("");
      router.refresh();
    } catch {
      toast.error("Fehler.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleNextMeeting(id: string, current: boolean) {
    try {
      await updateQuestion(id, { ask_at_next_meeting: !current });
      router.refresh();
    } catch {
      toast.error("Fehler.");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setAddingLoading(true);
    try {
      await createQuestion({
        question: newQuestion.trim(),
        customer_id: customerId,
        task_id: taskId ?? null,
        direction: newDirection,
        assigned_to: newAssignedTo || null,
        ask_at_next_meeting: false,
      });
      toast.success("Frage hinzugefügt.");
      setNewQuestion("");
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("Fehler.");
    } finally {
      setAddingLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Neue Frage
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Noch keine Fragen.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={q.direction === "internal" ? "text-purple-700 border-purple-200 bg-purple-50 text-xs" : "text-blue-700 border-blue-200 bg-blue-50 text-xs"}>
                      {q.direction === "internal" ? "Intern" : "Kunde"}
                    </Badge>
                    {q.assigned_to && <span className="text-xs text-muted-foreground">→ {q.assigned_to}</span>}
                    {q.ask_at_next_meeting && (
                      <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-xs">
                        <Bookmark className="h-3 w-3 mr-1" />Im Meeting
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-xs ${q.status === "answered" ? "text-green-700 border-green-200 bg-green-50" : q.status === "wont_answer" ? "text-slate-500" : ""}`}>
                      {q.status === "open" ? "Offen" : q.status === "answered" ? "Beantwortet" : "Kein Bedarf"}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{q.question}</p>
                  {q.answer && <p className="text-sm text-muted-foreground mt-1 pl-2 border-l-2">↳ {q.answer}</p>}
                  {q.tasks && context === "customer" && (
                    <p className="text-xs text-muted-foreground mt-1">Task: {q.tasks.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Im nächsten Meeting ansprechen"
                    onClick={() => toggleNextMeeting(q.id, q.ask_at_next_meeting)}
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${q.ask_at_next_meeting ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                  </Button>
                  {q.status === "open" && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}>
                      Antworten
                    </Button>
                  )}
                </div>
              </div>

              {answeringId === q.id && (
                <div className="space-y-2 pt-1">
                  <Textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Antwort eingeben …" rows={2} autoFocus />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={saving} onClick={() => handleAnswer(q.id)}>Speichern</Button>
                    <Button size="sm" variant="outline" onClick={() => setAnsweringId(null)}>Abbrechen</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Frage</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Richtung</Label>
              <Select value={newDirection} onValueChange={(v) => setNewDirection(v as "internal" | "customer")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">An Kunden</SelectItem>
                  <SelectItem value="internal">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned-to">An wen?</Label>
              <Input id="assigned-to" value={newAssignedTo} onChange={(e) => setNewAssignedTo(e.target.value)} placeholder="z.B. Anna, Maria …" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Frage *</Label>
              <Textarea id="question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required autoFocus rows={3} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={addingLoading}>{addingLoading ? "…" : "Hinzufügen"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
