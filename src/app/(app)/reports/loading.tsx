import { Skeleton, SkeletonTitle } from "@/components/skeletons/skeleton-primitives";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonTitle />
      <Skeleton className="h-20 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
