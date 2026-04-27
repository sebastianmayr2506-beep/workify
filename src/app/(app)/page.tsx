import {
  getAllTasks,
  getAllProjectsWithStats,
  getOpenQuestionsCountForDashboard,
  getCustomersAndProjectsForFilter,
} from "@/lib/actions/dashboard";
import { getRunningTimer } from "@/lib/actions/time-entries";
import { DashboardView } from "@/components/dashboard/dashboard-view";

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-AT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const [tasks, projects, openQuestions, runningTimer, filterData] = await Promise.all([
    getAllTasks({ includeDone: true }).catch(() => []),
    getAllProjectsWithStats().catch(() => []),
    getOpenQuestionsCountForDashboard().catch(() => 0),
    getRunningTimer().catch(() => null),
    getCustomersAndProjectsForFilter().catch(() => ({ customers: [], projects: [] })),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{formatDate(new Date())}</p>
      </div>
      <DashboardView
        initialTasks={tasks}
        initialProjects={projects}
        initialOpenQuestions={openQuestions}
        initialRunningTimer={runningTimer}
        customers={filterData.customers}
        allProjects={filterData.projects}
      />
    </div>
  );
}
