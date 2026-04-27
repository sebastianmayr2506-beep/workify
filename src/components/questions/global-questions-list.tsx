"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateQuestion } from "@/lib/actions/questions";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  direction: "internal" | "customer";
  assigned_to: string | null;
  status: "open" | "answered" | "wont_answer";
  ask_at_next_meeting: boolean;
  customer_id: string;
  task_id: string | null;
  created_at: string;
  customers: { id: string; name: string } | null;
}

interface Props {
  questions: Question[];
}

type Filter = "all" | "open" | "answered";

export function GlobalQuestionsList({ questions }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("open");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = questions.filter((q) => {
    if (filter === "open") return q.status === "open";
    if (filter === "answered") return q.status === "answered" || q.status === "wont_answer";
    return true;
  });

  // Group by customer
  const grouped = filtered.reduce<Record<string, { customer: { id: string; name: string } | null; questions: Question[] }>>((acc, q) => {
    const key = q.customer_id;
    if (!acc[key]) acc[key] = { customer: q.customers as { id: string; name: string } | null, questions: [] };
    acc[key].questions.push(q);
    return acc;
  }, {});
  const groups = Object.values(grouped);

  const openCount = questions.filter((q) => q.status === "open").length;
  const answeredCount = questions.filter((q) => q.status !== "open").length;

  async function handleAnswer(id: string) {
    setSaving(true);
    try {
      await updateQuestion(id, { answer: answerText, status: "answered" });
      toast.success("Antwort gespeichert.");
      setAnsweringId(null);
      setAnswerText("");
      router.refresh();
    } catch {
      toast.error("Fehler beim Speichern.");
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

  async function markWontAnswer(id: string) {
    try {
      await updateQuestion(id, { status: "wont_answer" });
      toast.success("Als irrelevant markiert.");
      router.refresh();
    } catch {
      toast.error("Fehler.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b pb-0">
        {(["open", "answered", "all"] as Filter[]).map((f) => {
          const labels: Record<Filter, string> = { open: `Offen (${openCount})`, answered: `Beantwortet (${answeredCount})`, all: `Alle (${questions.length})` };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                filter === f
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="text-center py-16">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "open" ? "Keine offenen Fragen. " : "Keine Einträge."}
          </p>
        </div>
      )}

      {/* Grouped by customer */}
      {groups.map((group) => (
        <div key={group.customer?.id ?? "unknown"} className="space-y-2">
          <div className="flex items-center gap-2">
            {group.customer ? (
              <Link
                href={`/customers/${group.customer.id}?tab=questions`}
                className="text-sm font-semibold hover:underline"
              >
                {group.customer.name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">Unbekannter Kunde</span>
            )}
            <span className="text-xs text-muted-foreground">({group.questions.length})</span>
          </div>

          <div className="space-y-2 pl-3 border-l-2 border-muted">
            {group.questions.map((q) => (
              <div key={q.id} className="rounded-lg border p-3 space-y-2 bg-background">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={cn("text-xs", q.direction === "internal" ? "text-purple-700 border-purple-200 bg-purple-50" : "text-blue-700 border-blue-200 bg-blue-50")}>
                        {q.direction === "internal" ? "Intern" : "Kunde"}
                      </Badge>
                      {q.assigned_to && <span className="text-xs text-muted-foreground">→ {q.assigned_to}</span>}
                      {q.ask_at_next_meeting && (
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">
                          <Bookmark className="h-3 w-3 mr-1" />Im Meeting
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn("text-xs", q.status === "answered" ? "text-green-700 border-green-200 bg-green-50" : q.status === "wont_answer" ? "text-slate-500" : "")}>
                        {q.status === "open" ? "Offen" : q.status === "answered" ? "Beantwortet" : "Kein Bedarf"}
                      </Badge>
                    </div>
                    <p className="text-sm">{q.question}</p>
                    {q.answer && (
                      <p className="text-sm text-muted-foreground mt-1 pl-2 border-l-2">↳ {q.answer}</p>
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
                      <Bookmark className={cn("h-3.5 w-3.5", q.ask_at_next_meeting ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                    </Button>
                    {q.status === "open" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}
                        >
                          Antworten
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => markWontAnswer(q.id)}
                        >
                          Ignorieren
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {answeringId === q.id && (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Antwort eingeben …"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={saving} onClick={() => handleAnswer(q.id)}>
                        {saving ? "…" : "Speichern"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAnsweringId(null)}>Abbrechen</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
