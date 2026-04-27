import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getProject } from "@/lib/actions/projects";
import { getTasksByProject } from "@/lib/actions/tasks";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { TasksList } from "@/components/tasks/tasks-list";
import { ProjectEditForm } from "@/components/projects/project-edit-form";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, tasks] = await Promise.all([
    getProject(id).catch(() => null),
    getTasksByProject(id),
  ]);

  if (!project) notFound();
  const customer = project.customers as { id: string; name: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/customers" className="hover:underline">Kunden</Link>
            <span>/</span>
            {customer && <Link href={`/customers/${customer.id}`} className="hover:underline">{customer.name}</Link>}
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && <p className="text-muted-foreground text-sm mt-1">{project.description}</p>}
        </div>
        <ProjectEditForm project={project} />
      </div>

      <TasksList tasks={tasks} customerId={project.customer_id} projectId={id} />
    </div>
  );
}
