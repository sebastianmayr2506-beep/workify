"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectForm } from "@/components/projects/project-form";

interface Project {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  status: "planned" | "active" | "on_hold" | "done";
}

export function ProjectEditForm({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4 mr-1.5" />Bearbeiten
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Projekt bearbeiten</DialogTitle></DialogHeader>
          <ProjectForm
            customerId={project.customer_id}
            projectId={project.id}
            defaultValues={{ name: project.name, description: project.description ?? undefined, status: project.status }}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
