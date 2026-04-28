import { Skeleton, SkeletonTitle, SkeletonRow } from "@/components/skeletons/skeleton-primitives";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <SkeletonTitle />
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
      {/* View toggle */}
      <Skeleton className="h-9 w-72 rounded-lg" />
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-9 flex-1 min-w-[200px]" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
      {/* Table */}
      <div className="rounded-lg border">
        <Skeleton className="h-9 rounded-none rounded-t-lg" />
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="px-3"><SkeletonRow /></div>)}
      </div>
    </div>
  );
}
