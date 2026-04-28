"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export interface DashboardTask {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  half_billing: boolean;
  customer_id: string;
  project_id: string | null;
  customer_name: string | null;
  project_name: string | null;
  total_minutes: number;
  has_running_timer: boolean;
}

export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  status: "planned" | "active" | "on_hold" | "done";
  customer_id: string;
  customer_name: string | null;
  open_tasks: number;
  overdue_tasks: number;
  total_tasks: number;
  done_tasks: number;
  next_due_date: string | null;
}

/**
 * Get ALL tasks for the user. Optimized for dashboard:
 * - Done tasks: only last 60 days (avoid loading thousands of historical tasks)
 * - Time aggregation: only for non-done tasks (where the user actually needs to see "Zeit")
 */
export async function getAllTasks(opts?: { includeDone?: boolean }): Promise<DashboardTask[]> {
  const { supabase, user } = await getUser();

  let query = supabase
    .from("tasks")
    .select("id, title, description, status, priority, due_date, half_billing, customer_id, project_id, completed_at, customers(id, name), projects(id, name)")
    .eq("user_id", user.id);

  if (!opts?.includeDone) {
    query = query.neq("status", "done");
  } else {
    // Limit done tasks to last 60 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    const cutoffIso = cutoff.toISOString();
    query = query.or(`status.neq.done,completed_at.gte.${cutoffIso}`);
  }

  const { data: tasks, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  // Time aggregation only for non-done tasks (much smaller working set)
  const activeTaskIds = (tasks ?? []).filter((t) => t.status !== "done").map((t) => t.id);
  let timeMap: Record<string, number> = {};
  if (activeTaskIds.length > 0) {
    const { data: entries } = await supabase
      .from("time_entries")
      .select("task_id, started_at, ended_at")
      .eq("user_id", user.id)
      .in("task_id", activeTaskIds)
      .not("ended_at", "is", null);

    timeMap = (entries ?? []).reduce<Record<string, number>>((acc, e) => {
      const mins = Math.floor((new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime()) / 60000);
      acc[e.task_id] = (acc[e.task_id] ?? 0) + mins;
      return acc;
    }, {});
  }

  return (tasks ?? []).map((t) => {
    const customer = t.customers as { id: string; name: string } | null;
    const project = t.projects as { id: string; name: string } | null;
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      half_billing: t.half_billing,
      customer_id: t.customer_id,
      project_id: t.project_id,
      customer_name: customer?.name ?? null,
      project_name: project?.name ?? null,
      total_minutes: timeMap[t.id] ?? 0,
      has_running_timer: false, // computed from runningTimer prop in the view
    };
  });
}

/**
 * Get ALL projects with task statistics for the kanban view.
 */
export async function getAllProjectsWithStats(): Promise<DashboardProject[]> {
  const { supabase, user } = await getUser();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, description, status, customer_id, customers(id, name)")
    .eq("user_id", user.id)
    .order("name");
  if (error) throw error;

  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  // Fetch all tasks for these projects in one query
  const { data: tasks } = await supabase
    .from("tasks")
    .select("project_id, status, due_date")
    .eq("user_id", user.id)
    .in("project_id", projectIds);

  const today = new Date().toISOString().slice(0, 10);

  const statsMap = (tasks ?? []).reduce<
    Record<string, { open: number; overdue: number; total: number; done: number; nextDue: string | null }>
  >((acc, t) => {
    if (!t.project_id) return acc;
    if (!acc[t.project_id]) acc[t.project_id] = { open: 0, overdue: 0, total: 0, done: 0, nextDue: null };
    acc[t.project_id].total++;
    if (t.status === "done") {
      acc[t.project_id].done++;
    } else {
      acc[t.project_id].open++;
      if (t.due_date && t.due_date < today) acc[t.project_id].overdue++;
      if (t.due_date && (!acc[t.project_id].nextDue || t.due_date < acc[t.project_id].nextDue!)) {
        acc[t.project_id].nextDue = t.due_date;
      }
    }
    return acc;
  }, {});

  return projects.map((p) => {
    const customer = p.customers as { id: string; name: string } | null;
    const stats = statsMap[p.id] ?? { open: 0, overdue: 0, total: 0, done: 0, nextDue: null };
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      customer_id: p.customer_id,
      customer_name: customer?.name ?? null,
      open_tasks: stats.open,
      overdue_tasks: stats.overdue,
      total_tasks: stats.total,
      done_tasks: stats.done,
      next_due_date: stats.nextDue,
    };
  });
}

export async function updateProjectStatus(
  id: string,
  status: "planned" | "active" | "on_hold" | "done"
) {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/");
}

export interface SearchResult {
  type: "task" | "project" | "customer";
  id: string;
  label: string;
  context: string | null;
  href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  const { supabase, user } = await getUser();
  const term = `%${query}%`;

  const [tasksRes, projectsRes, customersRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, customer_id, customers(name)")
      .eq("user_id", user.id)
      .or(`title.ilike.${term},description.ilike.${term}`)
      .limit(8),
    supabase
      .from("projects")
      .select("id, name, customers(name)")
      .eq("user_id", user.id)
      .ilike("name", term)
      .limit(5),
    supabase
      .from("customers")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .ilike("name", term)
      .limit(5),
  ]);

  const results: SearchResult[] = [];
  for (const t of tasksRes.data ?? []) {
    const c = t.customers as { name: string } | null;
    results.push({ type: "task", id: t.id, label: t.title, context: c?.name ?? null, href: `/tasks/${t.id}` });
  }
  for (const p of projectsRes.data ?? []) {
    const c = p.customers as { name: string } | null;
    results.push({ type: "project", id: p.id, label: p.name, context: c?.name ?? null, href: `/projects/${p.id}` });
  }
  for (const c of customersRes.data ?? []) {
    results.push({ type: "customer", id: c.id, label: c.name, context: null, href: `/customers/${c.id}` });
  }
  return results;
}

export async function getCustomersAndProjectsForFilter() {
  const { supabase, user } = await getUser();
  const [customersRes, projectsRes] = await Promise.all([
    supabase.from("customers").select("id, name").eq("user_id", user.id).eq("is_archived", false).order("name"),
    supabase.from("projects").select("id, name, customer_id").eq("user_id", user.id).order("name"),
  ]);
  return {
    customers: customersRes.data ?? [],
    projects: projectsRes.data ?? [],
  };
}

export async function getOpenQuestionsCountForDashboard() {
  const { supabase, user } = await getUser();
  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "open");
  if (error) throw error;
  return count ?? 0;
}
