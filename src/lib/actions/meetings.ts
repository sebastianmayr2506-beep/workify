"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MeetingFormData {
  title: string;
  meeting_date: string;
  customer_id: string;
  notes?: string;
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export async function getMeetingsByCustomer(customerId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("customer_id", customerId)
    .eq("user_id", user.id)
    .order("meeting_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMeeting(id: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("meetings")
    .select("*, customers(id, name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function getMeetingTasks(meetingId: string) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("meeting_tasks")
    .select("tasks(*)")
    .eq("meeting_id", meetingId);
  if (error) throw error;
  return (data ?? []).map((row) => row.tasks).filter(Boolean);
}

export async function createMeeting(formData: MeetingFormData) {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from("meetings")
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/customers/${formData.customer_id}`);
  return data;
}

export async function updateMeeting(id: string, formData: Partial<MeetingFormData>) {
  const { supabase, user } = await getUser();
  const { customer_id: _, ...updateData } = formData;
  const { data, error } = await supabase
    .from("meetings")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/meetings/${id}`);
  return data;
}

export async function addTaskToMeeting(meetingId: string, taskId: string) {
  const { supabase } = await getUser();
  const { error } = await supabase
    .from("meeting_tasks")
    .insert({ meeting_id: meetingId, task_id: taskId });
  if (error) throw error;
  revalidatePath(`/meetings/${meetingId}`);
}

export async function removeTaskFromMeeting(meetingId: string, taskId: string) {
  const { supabase } = await getUser();
  const { error } = await supabase
    .from("meeting_tasks")
    .delete()
    .eq("meeting_id", meetingId)
    .eq("task_id", taskId);
  if (error) throw error;
  revalidatePath(`/meetings/${meetingId}`);
}
