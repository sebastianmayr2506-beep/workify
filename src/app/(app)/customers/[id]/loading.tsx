import { Skeleton, SkeletonTitle } from "@/components/skeletons/skeleton-primitives";

export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SkeletonTitle />
        <div className="flex gap-2"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-24" /></div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-10 w-96 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    </div>
  );
}
