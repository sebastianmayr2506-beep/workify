"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getTimeReport, getTaskCompletionReport, type TimeReport, type TaskCompletionReport } from "@/lib/actions/reports";
import { cn } from "@/lib/utils";

function formatDuration(minutes: number): string {
  if (minutes === 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1) + "h";
}

type Preset = "week" | "month" | "lastMonth" | "custom";

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "week") {
    const day = now.getDay() || 7; // Mon=1
    const mon = new Date(now);
    mon.setDate(now.getDate() - day + 1);
    return { from: fmt(mon), to: fmt(now) };
  }
  if (preset === "month") {
    return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: fmt(now) };
  }
  if (preset === "lastMonth") {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(last), to: fmt(lastEnd) };
  }
  return { from: fmt(now), to: fmt(now) };
}

interface Props {
  initialFrom: string;
  initialTo: string;
  initialTime: TimeReport;
  initialCompletion: TaskCompletionReport;
}

export function ReportsView({ initialFrom, initialTo, initialTime, initialCompletion }: Props) {
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [time, setTime] = useState(initialTime);
  const [completion, setCompletion] = useState(initialCompletion);
  const [isPending, startTransition] = useTransition();
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const range = getPresetRange(p);
      setFrom(range.from);
      setTo(range.to);
      load(range.from, range.to);
    }
  }

  function load(f: string, t: string) {
    startTransition(async () => {
      const [timeData, completionData] = await Promise.all([
        getTimeReport(f, t),
        getTaskCompletionReport(f, t),
      ]);
      setTime(timeData);
      setCompletion(completionData);
      setExpandedCustomers(new Set());
    });
  }

  function toggleCustomer(id: string) {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const presets: { key: Preset; label: string }[] = [
    { key: "week", label: "Diese Woche" },
    { key: "month", label: "Dieser Monat" },
    { key: "lastMonth", label: "Letzter Monat" },
    { key: "custom", label: "Benutzerdefiniert" },
  ];

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                preset === p.key ? "bg-foreground text-background border-foreground" : "border-muted hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Von</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bis</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-40" />
            </div>
            <Button size="sm" onClick={() => load(from, to)} disabled={isPending} className="h-8">
              {isPending ? "Lädt …" : "Anwenden"}
            </Button>
          </div>
        )}
      </div>

      {isPending && (
        <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Lade Daten …</div>
      )}

      {!isPending && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />Gesamt
              </div>
              <p className="text-2xl font-bold">{formatHours(time.totalMinutes)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3.5 w-3.5" />Voll verrechnet
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatHours(time.fullBillingMinutes)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-violet-500" />Halb verrechnet
              </div>
              <p className="text-2xl font-bold text-violet-600">{formatHours(time.halfBillingMinutes)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Erledigt
              </div>
              <p className="text-2xl font-bold text-green-600">{completion.completed}</p>
            </div>
          </div>

          {/* Time by customer */}
          <section className="space-y-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />Zeit nach Kunde
            </h2>
            {time.byCustomer.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Zeiteinträge im gewählten Zeitraum.</p>
            ) : (
              <div className="rounded-lg border divide-y">
                {time.byCustomer.map((c) => {
                  const expanded = expandedCustomers.has(c.customerId);
                  const tasks = time.rows.filter((r) => r.customerId === c.customerId);
                  return (
                    <div key={c.customerId}>
                      <button
                        onClick={() => toggleCustomer(c.customerId)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <Link
                          href={`/customers/${c.customerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-sm hover:underline"
                        >
                          {c.customerName}
                        </Link>
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          {c.halfBillingMinutes > 0 && (
                            <Badge variant="outline" className="text-xs text-violet-700 border-violet-200 bg-violet-50">
                              ½ {formatDuration(c.halfBillingMinutes)}
                            </Badge>
                          )}
                          <span className="text-sm font-semibold tabular-nums">{formatDuration(c.totalMinutes)}</span>
                        </div>
                      </button>
                      {expanded && (
                        <div className="bg-muted/30 divide-y border-t">
                          {tasks.map((row) => (
                            <div key={row.taskId} className="flex items-center gap-3 px-8 py-2.5">
                              <Link href={`/tasks/${row.taskId}`} className="flex-1 text-sm hover:underline line-clamp-1 min-w-0">
                                {row.taskTitle}
                              </Link>
                              <div className="flex items-center gap-2 shrink-0">
                                {row.halfBilling && (
                                  <Badge variant="outline" className="text-xs text-violet-700 border-violet-200 bg-violet-50">½</Badge>
                                )}
                                <span className="text-sm tabular-nums text-muted-foreground">{formatDuration(row.totalMinutes)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Total row */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 font-medium">
                  <span className="flex-1 text-sm">Gesamt</span>
                  <span className="text-sm tabular-nums">{formatDuration(time.totalMinutes)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Completed tasks by customer */}
          {completion.byCustomer.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />Erledigte Tasks nach Kunde
              </h2>
              <div className="rounded-lg border divide-y">
                {completion.byCustomer.map((c) => (
                  <div key={c.customerId} className="flex items-center gap-3 px-4 py-2.5">
                    <Link href={`/customers/${c.customerId}`} className="flex-1 text-sm hover:underline">
                      {c.customerName}
                    </Link>
                    <span className="text-sm font-semibold tabular-nums">{c.count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
