"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getRunningTimer() {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("time_entries")
    .select("id, task_id, started_at")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function startTimer(taskId: string) {
  const { supabase, user } = await getUser();

  // Check for existing running timer
  const { data: running } = await supabase
    .from("time_entries")
    .select("id, task_id")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (running) {
    return { conflict: true, runningTaskId: running.task_id, runningEntryId: running.id };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({ task_id: taskId, user_id: user.id, started_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return { conflict: false, entry: data };
}

export async function stopTimer(entryId: string, taskId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("time_entries")
    .update({ ended_at: new Date().toISOString() } as never)
    .eq("id", entryId)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return data;
}

export async function stopAndStartTimer(runningEntryId: string, runningTaskId: string, newTaskId: string) {
  const { supabase, user } = await getUser();
  const now = new Date().toISOString();

  const { error: stopError } = await supabase
    .from("time_entries")
    .update({ ended_at: now } as never)
    .eq("id", runningEntryId)
    .eq("user_id", user.id);
  if (stopError) throw stopError;

  const { data, error: startError } = await supabase
    .from("time_entries")
    .insert({ task_id: newTaskId, user_id: user.id, started_at: now })
    .select()
    .single();
  if (startError) throw startError;

  revalidatePath(`/tasks/${runningTaskId}`);
  revalidatePath(`/tasks/${newTaskId}`);
  return data;
}

export async function getTimeEntriesByTask(taskId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("time_entries")
    .select("id, task_id, started_at, ended_at, note, created_at")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createManualEntry(taskId: string, startedAt: string, endedAt: string, note?: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("time_entries")
    .insert({ task_id: taskId, user_id: user.id, started_at: startedAt, ended_at: endedAt, note: note || null })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return data;
}

export async function updateTimeEntry(id: string, taskId: string, updates: { started_at?: string; ended_at?: string | null; note?: string | null }) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("time_entries")
    .update(updates as never)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
  return data;
}

export async function deleteTimeEntry(id: string, taskId: string) {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath(`/tasks/${taskId}`);
}

export interface TimeSummary {
  totalMinutes: number;
  fullBillingMinutes: number;
  halfBillingMinutes: number;
}

export async function getTimeSummaryByTask(taskId: string, isHalfBilling: boolean): Promise<TimeSummary> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("time_entries")
    .select("started_at, ended_at")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .not("ended_at", "is", null);
  if (error) throw error;

  let totalMinutes = 0;
  for (const entry of data ?? []) {
    const mins = Math.floor((new Date(entry.ended_at!).getTime() - new Date(entry.started_at).getTime()) / 60000);
    totalMinutes += mins;
  }

  return {
    totalMinutes,
    fullBillingMinutes: isHalfBilling ? 0 : totalMinutes,
    halfBillingMinutes: isHalfBilling ? totalMinutes : 0,
  };
}
