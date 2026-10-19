"use client";

import clsx from "clsx";
import { useState } from "react";
import { ProductImage } from "@/components/product-image";

/* eslint-disable @next/next/no-img-element */
export function ProductGallery({ images, alt, badge }: { images: string[]; alt: string; badge?: number | null }) {
  const [active, setActive] = useState(0);

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
        {images.length ? (
          <img key={images[active]} src={images[active]} alt={alt} className="absolute inset-0 size-full animate-fade-up object-contain p-10" />
        ) : (
          <ProductImage src={null} alt={alt} className="size-full" />
        )}
        {badge && <span className="absolute top-5 left-5 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-bold text-white">-{badge}%</span>}
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={clsx(
                "aspect-square cursor-pointer overflow-hidden rounded-xl border-2 bg-slate-50 transition",
                active === i ? "border-brand-600" : "border-transparent hover:border-slate-300",
              )}
            >
              <img src={src} alt="" loading="lazy" className="size-full object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
