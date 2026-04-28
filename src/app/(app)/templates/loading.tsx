import { Skeleton, SkeletonTitle } from "@/components/skeletons/skeleton-primitives";

export default function TemplatesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><SkeletonTitle /><Skeleton className="h-9 w-32" /></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
      </div>
    </div>
  );
}
