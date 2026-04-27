import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeeting, getMeetingTasks } from "@/lib/actions/meetings";
import { getOpenQuestionsForMeeting } from "@/lib/actions/questions";
import { MeetingEditButton } from "@/components/meetings/meeting-edit-button";
import { MeetingNotesEditor } from "@/components/meetings/meeting-notes-editor";
import { MeetingQuestionsPanel } from "@/components/meetings/meeting-questions-panel";
import { MeetingTasksSection } from "@/components/meetings/meeting-tasks-section";
import { Calendar } from "lucide-react";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [meeting, meetingTasks, openQuestions] = await Promise.all([
    getMeeting(id).catch(() => null),
    getMeetingTasks(id),
    getMeeting(id).then((m) => getOpenQuestionsForMeeting(m.customer_id)).catch(() => []),
  ]);

  if (!meeting) notFound();
  const customer = meeting.customers as { id: string; name: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/customers" className="hover:underline">Kunden</Link>
            <span>/</span>
            {customer && <Link href={`/customers/${customer.id}`} className="hover:underline">{customer.name}</Link>}
            <span>/</span>
            <span>{meeting.title}</span>
          </div>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            {new Date(meeting.meeting_date).toLocaleString("de-AT", {
              weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <MeetingEditButton meeting={{ id, title: meeting.title, meeting_date: meeting.meeting_date, customer_id: customer?.id ?? "" }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Markdown notes */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Notizen</h2>
            <MeetingNotesEditor meetingId={id} initialNotes={meeting.notes ?? ""} />
          </section>

          {/* Tasks */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Verknüpfte Tasks</h2>
            <MeetingTasksSection
              meetingId={id}
              customerId={customer?.id ?? ""}
              tasks={meetingTasks as { id: string; title: string; status: string }[]}
            />
          </section>
        </div>

        {/* Fragen-Sidebar */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Offene Fragen für dieses Meeting</h2>
          <MeetingQuestionsPanel meetingId={id} questions={openQuestions} />
        </div>
      </div>
    </div>
  );
}
