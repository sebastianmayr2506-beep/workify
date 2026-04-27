"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProjectFormData {
  name: string;
  description?: string;
  status?: "planned" | "active" | "on_hold" | "done";
  customer_id: string;
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getProjectsByCustomer(customerId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("customer_id", customerId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("projects")
    .select("*, customers(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProject(formData: ProjectFormData) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/customers/${formData.customer_id}`);
  return data;
}

export async function updateProject(id: string, formData: Partial<ProjectFormData>) {
  const { supabase, user } = await getUser();
  const { customer_id: _, ...updateData } = formData;
  const { data, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*, customers(name)")
    .single();
  if (error) throw error;
  revalidatePath(`/projects/${id}`);
  return data;
}
