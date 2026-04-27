"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createNote, deleteNote } from "@/lib/actions/notes";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  notes: Note[];
  taskId: string;
}

export function NotesList({ notes, taskId }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await createNote(taskId, content.trim());
      setContent("");
      setShowInput(false);
      router.refresh();
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id, taskId);
      router.refresh();
    } catch {
      toast.error("Fehler beim Löschen.");
    }
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div key={note.id} className="group flex items-start gap-2 rounded-lg border p-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(note.created_at).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDelete(note.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}

      {showInput ? (
        <form onSubmit={handleAdd} className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Notiz eingeben …"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>{loading ? "…" : "Speichern"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowInput(false)}>Abbrechen</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Notiz hinzufügen
        </Button>
      )}
    </div>
  );
}
