import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCustomer } from "@/lib/actions/customers";
import { getProjectsByCustomer } from "@/lib/actions/projects";
import { getTasksByCustomer } from "@/lib/actions/tasks";
import { getMeetingsByCustomer } from "@/lib/actions/meetings";
import { getQuestionsByCustomer } from "@/lib/actions/questions";
import { CustomerArchiveButton } from "@/components/customers/customer-archive-button";
import { ProjectsList } from "@/components/projects/projects-list";
import { TasksList } from "@/components/tasks/tasks-list";
import { MeetingsList } from "@/components/meetings/meetings-list";
import { QuestionsList } from "@/components/questions/questions-list";
import { CustomerLinks } from "@/components/customers/customer-links";
import { cn } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, projects, tasks, meetings, questions] = await Promise.all([
    getCustomer(id).catch(() => null),
    getProjectsByCustomer(id).catch(() => []),
    getTasksByCustomer(id).catch(() => []),
    getMeetingsByCustomer(id).catch(() => []),
    getQuestionsByCustomer(id).catch(() => []),
  ]);

  if (!customer) notFound();

  const extraLinks = (customer.extra_links as { label: string; url: string }[] | null) ?? [];
  const hasLinks = customer.awork_url || extraLinks.length > 0;
  const openQuestions = questions.filter((q) => q.status === "open");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/customers" className="hover:underline">Kunden</Link>
            <span>/</span>
            <span>{customer.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/customers/${id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Pencil className="h-4 w-4 mr-1.5" />Bearbeiten
          </Link>
          <CustomerArchiveButton id={id} isArchived={customer.is_archived} />
        </div>
      </div>

      {/* Hauptkontakt-Block */}
      {(customer.primary_contact_name || customer.primary_email || customer.primary_phone) && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
          {customer.primary_contact_name && (
            <span className="font-medium">{customer.primary_contact_name}</span>
          )}
          {customer.primary_email && (
            <a href={`mailto:${customer.primary_email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" />{customer.primary_email}
            </a>
          )}
          {customer.primary_phone && (
            <a href={`tel:${customer.primary_phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" />{customer.primary_phone}
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            Projekte
            {projects.length > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{projects.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks
            {tasks.length > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{tasks.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="questions">
            Fragen
            {openQuestions.length > 0 && <span className="ml-1.5 rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-xs">{openQuestions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="meetings">
            Meetings
            {meetings.length > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{meetings.length}</span>}
          </TabsTrigger>
          {hasLinks && <TabsTrigger value="links">Links</TabsTrigger>}
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <ProjectsList projects={projects} customerId={id} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <TasksList tasks={tasks} customerId={id} projectId={null} />
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <QuestionsList
            questions={questions}
            customerId={id}
            context="customer"
            primaryContactName={customer.primary_contact_name}
          />
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <MeetingsList meetings={meetings} customerId={id} />
        </TabsContent>

        {hasLinks && (
          <TabsContent value="links" className="mt-4">
            <CustomerLinks aworkUrl={customer.awork_url} extraLinks={extraLinks} />
          </TabsContent>
        )}
      </Tabs>

      {customer.notes && (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium mb-2 text-muted-foreground">Notizen</p>
          <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}
    </div>
  );
}
