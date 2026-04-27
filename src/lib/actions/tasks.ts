"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TaskFormData {
  title: string;
  description?: string;
  customer_id: string;
  project_id?: string | null;
  status?: "open" | "in_progress" | "waiting" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  half_billing?: boolean;
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getTask(id: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, customers(id, name, primary_contact_name), projects(id, name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function getTasksByCustomer(customerId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(name)")
    .eq("customer_id", customerId)
    .eq("user_id", user.id)
    .is("project_id", null)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTasksByProject(projectId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .order("status")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(formData: TaskFormData) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...formData, user_id: user.id, source: "manual" })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/customers/${formData.customer_id}`);
  if (formData.project_id) revalidatePath(`/projects/${formData.project_id}`);
  return data;
}

export async function updateTask(id: string, formData: Partial<TaskFormData> & { completed_at?: string | null }) {
  const { supabase, user } = await getUser();
  const { customer_id: _c, project_id, ...rest } = formData;
  const updateData = { ...rest, ...(project_id !== undefined ? { project_id } : {}) };
  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${id}`);
  return data;
}

export async function updateTaskStatus(id: string, status: "open" | "in_progress" | "waiting" | "done") {
  const { supabase, user } = await getUser();
  const completed_at = status === "done" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("tasks")
    .update({ status, completed_at })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${id}`);
  return data;
}
