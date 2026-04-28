import { Skeleton, SkeletonTitle } from "@/components/skeletons/skeleton-primitives";

export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between"><SkeletonTitle /><Skeleton className="h-9 w-28" /></div>
      <Skeleton className="h-16 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
    </div>
  );
}
