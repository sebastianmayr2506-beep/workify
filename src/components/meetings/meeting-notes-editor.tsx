"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateMeeting } from "@/lib/actions/meetings";

interface Props {
  meetingId: string;
  initialNotes: string;
}

export function MeetingNotesEditor({ meetingId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      await updateMeeting(meetingId, { notes });
      setDirty(false);
      toast.success("Notizen gespeichert.");
      router.refresh();
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
        placeholder="Notizen (Markdown) …"
        rows={10}
        className="font-mono text-sm resize-y"
      />
      {dirty && (
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Speichern …" : "Speichern"}
        </Button>
      )}
    </div>
  );
}
