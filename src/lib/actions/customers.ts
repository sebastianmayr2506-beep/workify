"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CustomerFormData {
  name: string;
  primary_contact_name?: string;
  primary_email?: string;
  primary_phone?: string;
  awork_url?: string;
  extra_links?: { label: string; url: string }[];
  notes?: string;
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getCustomers(includeArchived = false) {
  const { supabase, user } = await getUser();
  let query = supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("name");
  if (!includeArchived) query = query.eq("is_archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCustomer(id: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCustomer(formData: CustomerFormData) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/customers");
  return data;
}

export async function updateCustomer(id: string, formData: Partial<CustomerFormData>) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("customers")
    .update(formData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return data;
}

export async function archiveCustomer(id: string, archive: boolean) {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("customers")
    .update({ is_archived: archive })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}
