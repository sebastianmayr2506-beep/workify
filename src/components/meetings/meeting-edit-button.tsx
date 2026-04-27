"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MeetingForm } from "@/components/meetings/meeting-form";

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  customer_id: string;
}

export function MeetingEditButton({ meeting }: { meeting: Meeting }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4 mr-1.5" />Bearbeiten
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Meeting bearbeiten</DialogTitle></DialogHeader>
          <MeetingForm
            customerId={meeting.customer_id}
            meetingId={meeting.id}
            defaultValues={{ title: meeting.title, meeting_date: meeting.meeting_date }}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
