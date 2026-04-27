"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateQuestion } from "@/lib/actions/questions";

interface Question {
  id: string;
  question: string;
  direction: "internal" | "customer";
  assigned_to: string | null;
  tasks?: { title: string } | null;
}

interface Props {
  meetingId: string;
  questions: Question[];
}

export function MeetingQuestionsPanel({ meetingId, questions }: Props) {
  const router = useRouter();
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  async function handleResolve(id: string) {
    setSaving(true);
    try {
      await updateQuestion(id, {
        answer: answerText || "Im Meeting geklärt.",
        status: "answered",
        meeting_id: meetingId,
      });
      setResolved((prev) => new Set([...prev, id]));
      setAnsweringId(null);
      setAnswerText("");
      toast.success("Frage als geklärt markiert.");
      router.refresh();
    } catch {
      toast.error("Fehler.");
    } finally {
      setSaving(false);
    }
  }

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Keine offenen Fragen mit „Im Meeting"-Flag.</p>;
  }

  return (
    <div className="space-y-2">
      {questions.map((q) => {
        const isResolved = resolved.has(q.id);
        return (
          <div
            key={q.id}
            className={`rounded-lg border p-3 space-y-2 transition-opacity ${isResolved ? "opacity-40" : ""}`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${q.direction === "internal" ? "text-purple-700 border-purple-200 bg-purple-50" : "text-blue-700 border-blue-200 bg-blue-50"}`}>
                    {q.direction === "internal" ? "Intern" : "Kunde"}
                  </Badge>
                  {q.assigned_to && <span className="text-xs text-muted-foreground">→ {q.assigned_to}</span>}
                </div>
                <p className="text-sm mt-1">{q.question}</p>
                {q.tasks && <p className="text-xs text-muted-foreground mt-0.5">Task: {q.tasks.title}</p>}
              </div>
              {!isResolved && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setAnsweringId(answeringId === q.id ? null : q.id)}
                  title="Im Meeting geklärt"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>

            {answeringId === q.id && !isResolved && (
              <div className="space-y-2">
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Antwort / Ergebnis (optional) …"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={saving} onClick={() => handleResolve(q.id)}>Geklärt</Button>
                  <Button size="sm" variant="outline" onClick={() => setAnsweringId(null)}>Abbrechen</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
