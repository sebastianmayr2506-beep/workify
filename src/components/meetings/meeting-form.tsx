"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createMeeting, updateMeeting } from "@/lib/actions/meetings";

interface Props {
  customerId: string;
  meetingId?: string;
  defaultValues?: { title?: string; meeting_date?: string };
  onSuccess?: () => void;
}

export function MeetingForm({ customerId, meetingId, defaultValues, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [meetingDate, setMeetingDate] = useState(defaultValues?.meeting_date?.slice(0, 16) ?? localIso);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (meetingId) {
        await updateMeeting(meetingId, { title, meeting_date: new Date(meetingDate).toISOString() });
        toast.success("Meeting gespeichert.");
        router.refresh();
      } else {
        const meeting = await createMeeting({ title, meeting_date: new Date(meetingDate).toISOString(), customer_id: customerId });
        toast.success("Meeting angelegt.");
        router.push(`/meetings/${meeting.id}`);
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
        <Label htmlFor="meeting-date">Datum & Uhrzeit</Label>
        <Input id="meeting-date" type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "…" : "Speichern"}</Button>
        {onSuccess && <Button type="button" variant="outline" onClick={onSuccess}>Abbrechen</Button>}
      </div>
    </form>
  );
}
