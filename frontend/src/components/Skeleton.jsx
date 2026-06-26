export default function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-zinc-800 rounded-md ${className}`}></div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl p-6 shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800">
      <div className="flex gap-4 items-center mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}
