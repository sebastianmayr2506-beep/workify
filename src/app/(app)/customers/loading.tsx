import { Skeleton, SkeletonTitle } from "@/components/skeletons/skeleton-primitives";

export default function CustomersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonTitle />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
    </div>
  );
}
