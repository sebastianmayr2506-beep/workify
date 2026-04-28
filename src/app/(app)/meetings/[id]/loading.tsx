import { Skeleton, SkeletonTitle } from "@/components/skeletons/skeleton-primitives";

export default function MeetingDetailLoading() {
  return (
    <div className="space-y-6">
      <SkeletonTitle />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
