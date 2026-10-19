import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <SearchX className="size-8" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/shop" className="btn-outline">
          Browse products
        </Link>
      </div>
    </div>
  );
}
