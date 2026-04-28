import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function SkeletonTitle() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return <Skeleton className={cn("h-20 w-full rounded-lg", className)} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 flex-1 max-w-[300px]" />
      <Skeleton className="h-4 w-24 hidden md:block" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}
