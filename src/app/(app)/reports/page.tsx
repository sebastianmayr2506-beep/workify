import { getTimeReport, getTaskCompletionReport } from "@/lib/actions/reports";
import { ReportsView } from "@/components/reports/reports-view";

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return { from, to };
}

export default async function ReportsPage() {
  const { from, to } = getMonthRange();

  const [timeReport, completionReport] = await Promise.all([
    getTimeReport(from, to).catch(() => ({
      rows: [],
      totalMinutes: 0,
      fullBillingMinutes: 0,
      halfBillingMinutes: 0,
      byCustomer: [],
    })),
    getTaskCompletionReport(from, to).catch(() => ({ completed: 0, byCustomer: [] })),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Zeiterfassung und Aufgaben-Übersicht nach Zeitraum.</p>
      </div>
      <ReportsView
        initialFrom={from}
        initialTo={to}
        initialTime={timeReport}
        initialCompletion={completionReport}
      />
    </div>
  );
}
