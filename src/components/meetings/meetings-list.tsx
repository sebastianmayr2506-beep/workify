"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MeetingForm } from "@/components/meetings/meeting-form";

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
}

interface Props {
  meetings: Meeting[];
  customerId: string;
}

export function MeetingsList({ meetings, customerId }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Neues Meeting
        </Button>
      </div>

      {meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Noch keine Meetings.</p>
      ) : (
        <div className="space-y-2">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/meetings/${meeting.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{meeting.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(meeting.meeting_date).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neues Meeting</DialogTitle></DialogHeader>
          <MeetingForm customerId={customerId} onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
