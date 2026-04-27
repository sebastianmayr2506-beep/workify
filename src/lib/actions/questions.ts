"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface QuestionFormData {
  question: string;
  customer_id: string;
  task_id?: string | null;
  direction?: "internal" | "customer";
  assigned_to?: string | null;
  ask_at_next_meeting?: boolean;
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getQuestionsByCustomer(customerId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("questions")
    .select("id, user_id, customer_id, task_id, meeting_id, direction, assigned_to, question, answer, status, ask_at_next_meeting, asked_at, created_at, updated_at")
    .eq("customer_id", customerId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((q) => ({ ...q, tasks: null }));
}

export async function getQuestionsByTask(taskId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getOpenQuestionsForMeeting(customerId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("questions")
    .select("id, user_id, customer_id, task_id, meeting_id, direction, assigned_to, question, answer, status, ask_at_next_meeting, asked_at, created_at, updated_at")
    .eq("customer_id", customerId)
    .eq("user_id", user.id)
    .eq("status", "open")
    .eq("ask_at_next_meeting", true)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((q) => ({ ...q, tasks: null }));
}

export async function getAllQuestions() {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("questions")
    .select("id, user_id, customer_id, task_id, meeting_id, direction, assigned_to, question, answer, status, ask_at_next_meeting, asked_at, created_at, updated_at, customers(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getOpenQuestionsCount() {
  const { supabase, user } = await getUser();
  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "open");
  if (error) throw error;
  return count ?? 0;
}

export async function createQuestion(formData: QuestionFormData) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("questions")
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  if (formData.task_id) revalidatePath(`/tasks/${formData.task_id}`);
  revalidatePath(`/customers/${formData.customer_id}`);
  return data;
}

export async function updateQuestion(
  id: string,
  updates: { answer?: string; status?: "open" | "answered" | "wont_answer"; ask_at_next_meeting?: boolean; meeting_id?: string | null }
) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/questions");
  return data;
}
