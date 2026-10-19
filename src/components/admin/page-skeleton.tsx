/** Placeholder shown while an admin page streams in (used by loading.tsx files). */
export function AdminPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="card overflow-hidden">
        <div className="h-14 animate-pulse border-b border-slate-200 bg-slate-100/70" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0">
            <div className="size-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
