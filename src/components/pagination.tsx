import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Params = Record<string, string | string[] | undefined>;

function hrefFor(basePath: string, params: Params, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Page numbers around the current page, with gaps marked as null. */
function pageList(page: number, pages: number): (number | null)[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}

export function Pagination({ page, pages, params, basePath }: { page: number; pages: number; params: Params; basePath: string }) {
  if (pages <= 1) return null;

  const item = "flex size-10 items-center justify-center rounded-full text-sm font-semibold transition";

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(basePath, params, page - 1)} className={clsx(item, "text-slate-600 hover:bg-slate-100")} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={clsx(item, "text-slate-300")}>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pageList(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, params, p)}
            aria-current={p === page ? "page" : undefined}
            className={clsx(item, p === page ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link href={hrefFor(basePath, params, page + 1)} className={clsx(item, "text-slate-600 hover:bg-slate-100")} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={clsx(item, "text-slate-300")}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
