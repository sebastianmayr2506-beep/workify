import { getTemplates } from "@/lib/actions/templates";
import { TemplatesList } from "@/components/templates/templates-list";

export default async function TemplatesPage() {
  const templates = await getTemplates().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vorlagen für wiederkehrende Tasks — mit einem Klick vorausgefüllt erstellen.</p>
      </div>
      <TemplatesList templates={templates} />
    </div>
  );
}
