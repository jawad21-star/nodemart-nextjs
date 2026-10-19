import { ShoppingBag } from "lucide-react";
import clsx from "clsx";

/* eslint-disable @next/next/no-img-element -- product images come from any host or /uploads */
export function ProductImage({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={clsx("flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400", className)}>
        <ShoppingBag className="size-10" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={clsx("object-contain", className)} />;
}
