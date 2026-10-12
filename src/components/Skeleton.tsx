export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        animate-pulse rounded-lg bg-zinc-800/60
        ${className}
      `}
    />
  );
}

export function ExerciseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mb-3 flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <ExerciseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-3 text-center">
      <Skeleton className="mx-auto h-6 w-12" />
      <Skeleton className="mx-auto mt-1.5 h-2.5 w-16" />
    </div>
  );
}