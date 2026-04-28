import { Skeleton, SkeletonTitle } from "@/components/skeletons/skeleton-primitives";

export default function QuestionsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonTitle />
      <Skeleton className="h-9 w-72 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2 pl-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
