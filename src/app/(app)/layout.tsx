import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RunningTimerIndicator } from "@/components/timer/running-timer-indicator";
import { AiImportButton } from "@/components/ai-import/ai-import-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2 h-14">
          <div className="md:hidden font-bold text-base">Workify</div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <AiImportButton />
            <RunningTimerIndicator />
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 px-4 py-6 pb-24 md:pb-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
