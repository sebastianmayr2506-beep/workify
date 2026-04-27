"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getNotesByTask(taskId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_notes")
    .select("*")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createNote(taskId: string, content: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_notes")
    .insert({ task_id: taskId, content, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return data;
}

export async function deleteNote(id: string, taskId: string) {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("task_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
}
