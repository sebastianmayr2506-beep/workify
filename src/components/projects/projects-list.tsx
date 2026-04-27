"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { ProjectForm } from "@/components/projects/project-form";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "planned" | "active" | "on_hold" | "done";
  created_at: string;
}

interface Props {
  projects: Project[];
  customerId: string;
}

export function ProjectsList({ projects, customerId }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Neues Projekt
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Noch keine Projekte.</p>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{project.name}</p>
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{project.description}</p>
                )}
              </div>
              <ProjectStatusBadge status={project.status} />
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neues Projekt</DialogTitle></DialogHeader>
          <ProjectForm customerId={customerId} onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
