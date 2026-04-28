"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  content: string;
  is_done: boolean;
  sort_order: number;
}

export async function getChecklistByTask(taskId: string): Promise<ChecklistItem[]> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_checklist_items")
    .select("id, task_id, content, is_done, sort_order")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function createChecklistItem(taskId: string, content: string): Promise<ChecklistItem> {
  const { supabase, user } = await getUser();

  // Get max sort_order for this task to append at the end
  const { data: existing } = await supabase
    .from("task_checklist_items")
    .select("sort_order")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("task_checklist_items")
    .insert({ task_id: taskId, user_id: user.id, content, sort_order: nextSort })
    .select("id, task_id, content, is_done, sort_order")
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return data;
}

export async function toggleChecklistItem(id: string, taskId: string, isDone: boolean): Promise<ChecklistItem> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_checklist_items")
    .update({ is_done: isDone } as never)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, task_id, content, is_done, sort_order")
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return data;
}

export async function updateChecklistItem(id: string, taskId: string, content: string): Promise<ChecklistItem> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("task_checklist_items")
    .update({ content } as never)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, task_id, content, is_done, sort_order")
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return data;
}

export async function deleteChecklistItem(id: string, taskId: string): Promise<void> {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("task_checklist_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
}

export async function reorderChecklistItems(taskId: string, orderedIds: string[]): Promise<void> {
  const { supabase, user } = await getUser();
  // Update each item's sort_order in a single batch
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("task_checklist_items")
        .update({ sort_order: index } as never)
        .eq("id", id)
        .eq("user_id", user.id)
    )
  );
  revalidatePath(`/tasks/${taskId}`);
}
