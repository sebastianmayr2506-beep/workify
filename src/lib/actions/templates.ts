"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TemplateFormData {
  name: string;
  default_title?: string | null;
  default_description?: string | null;
  default_priority?: "low" | "medium" | "high" | "urgent" | null;
  default_customer_id?: string | null;
  default_project_id?: string | null;
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getTemplates() {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_templates")
    .select("id, user_id, name, default_title, default_description, default_priority, default_customer_id, default_project_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("name");
  if (error) throw error;
  const templates = data ?? [];

  // Enrich with customer/project names
  const customerIds = [...new Set(templates.map((t) => t.default_customer_id).filter(Boolean) as string[])];
  const projectIds = [...new Set(templates.map((t) => t.default_project_id).filter(Boolean) as string[])];

  const [customersRes, projectsRes] = await Promise.all([
    customerIds.length > 0
      ? supabase.from("customers").select("id, name").in("id", customerIds)
      : { data: [] },
    projectIds.length > 0
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : { data: [] },
  ]);

  const customersMap = Object.fromEntries((customersRes.data ?? []).map((c) => [c.id, c]));
  const projectsMap = Object.fromEntries((projectsRes.data ?? []).map((p) => [p.id, p]));

  return templates.map((t) => ({
    ...t,
    customers: t.default_customer_id ? (customersMap[t.default_customer_id] ?? null) : null,
    projects: t.default_project_id ? (projectsMap[t.default_project_id] ?? null) : null,
  }));
}

export async function createTemplate(formData: TemplateFormData) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_templates")
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/templates");
  return data;
}

export async function updateTemplate(id: string, formData: Partial<TemplateFormData>) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_templates")
    .update(formData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/templates");
  return data;
}

export async function deleteTemplate(id: string) {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("task_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/templates");
}
