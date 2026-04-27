"use server";

import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");
  return { supabase, user };
}

export interface TimeReportRow {
  customerId: string;
  customerName: string;
  taskId: string;
  taskTitle: string;
  halfBilling: boolean;
  totalMinutes: number;
}

export interface TimeReport {
  rows: TimeReportRow[];
  totalMinutes: number;
  fullBillingMinutes: number;
  halfBillingMinutes: number;
  byCustomer: {
    customerId: string;
    customerName: string;
    totalMinutes: number;
    fullBillingMinutes: number;
    halfBillingMinutes: number;
  }[];
}

export async function getTimeReport(from: string, to: string): Promise<TimeReport> {
  const { supabase, user } = await getUser();

  // Fetch completed time entries in range
  const { data: entries, error } = await supabase
    .from("time_entries")
    .select("id, task_id, started_at, ended_at")
    .eq("user_id", user.id)
    .not("ended_at", "is", null)
    .gte("started_at", from)
    .lte("started_at", to + "T23:59:59");
  if (error) throw error;

  if (!entries || entries.length === 0) {
    return { rows: [], totalMinutes: 0, fullBillingMinutes: 0, halfBillingMinutes: 0, byCustomer: [] };
  }

  // Fetch all tasks involved
  const taskIds = [...new Set(entries.map((e) => e.task_id))];
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, half_billing, customer_id, customers(id, name)")
    .in("id", taskIds);

  const taskMap = Object.fromEntries((tasks ?? []).map((t) => [t.id, t]));

  // Aggregate by task
  const byTask: Record<string, { minutes: number }> = {};
  for (const entry of entries) {
    const mins = Math.floor(
      (new Date(entry.ended_at!).getTime() - new Date(entry.started_at).getTime()) / 60000
    );
    byTask[entry.task_id] = { minutes: (byTask[entry.task_id]?.minutes ?? 0) + mins };
  }

  const rows: TimeReportRow[] = Object.entries(byTask).map(([taskId, { minutes }]) => {
    const task = taskMap[taskId];
    const customer = task?.customers as { id: string; name: string } | null;
    return {
      taskId,
      taskTitle: task?.title ?? "Unbekannt",
      customerId: task?.customer_id ?? "",
      customerName: customer?.name ?? "Unbekannt",
      halfBilling: task?.half_billing ?? false,
      totalMinutes: minutes,
    };
  }).sort((a, b) => a.customerName.localeCompare(b.customerName) || b.totalMinutes - a.totalMinutes);

  const totalMinutes = rows.reduce((s, r) => s + r.totalMinutes, 0);
  const fullBillingMinutes = rows.filter((r) => !r.halfBilling).reduce((s, r) => s + r.totalMinutes, 0);
  const halfBillingMinutes = rows.filter((r) => r.halfBilling).reduce((s, r) => s + r.totalMinutes, 0);

  // Group by customer
  const customerMap: Record<string, TimeReport["byCustomer"][0]> = {};
  for (const row of rows) {
    if (!customerMap[row.customerId]) {
      customerMap[row.customerId] = {
        customerId: row.customerId,
        customerName: row.customerName,
        totalMinutes: 0,
        fullBillingMinutes: 0,
        halfBillingMinutes: 0,
      };
    }
    customerMap[row.customerId].totalMinutes += row.totalMinutes;
    if (row.halfBilling) {
      customerMap[row.customerId].halfBillingMinutes += row.totalMinutes;
    } else {
      customerMap[row.customerId].fullBillingMinutes += row.totalMinutes;
    }
  }

  return {
    rows,
    totalMinutes,
    fullBillingMinutes,
    halfBillingMinutes,
    byCustomer: Object.values(customerMap).sort((a, b) => b.totalMinutes - a.totalMinutes),
  };
}

export interface TaskCompletionReport {
  completed: number;
  byCustomer: { customerId: string; customerName: string; count: number }[];
}

export async function getTaskCompletionReport(from: string, to: string): Promise<TaskCompletionReport> {
  const { supabase, user } = await getUser();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, customer_id, customers(id, name)")
    .eq("user_id", user.id)
    .eq("status", "done")
    .not("completed_at", "is", null)
    .gte("completed_at", from)
    .lte("completed_at", to + "T23:59:59");
  if (error) throw error;

  const tasks = data ?? [];
  const byCustomer: Record<string, { customerId: string; customerName: string; count: number }> = {};
  for (const t of tasks) {
    const customer = t.customers as { id: string; name: string } | null;
    const cId = t.customer_id;
    if (!byCustomer[cId]) {
      byCustomer[cId] = { customerId: cId, customerName: customer?.name ?? "Unbekannt", count: 0 };
    }
    byCustomer[cId].count++;
  }

  return {
    completed: tasks.length,
    byCustomer: Object.values(byCustomer).sort((a, b) => b.count - a.count),
  };
}
