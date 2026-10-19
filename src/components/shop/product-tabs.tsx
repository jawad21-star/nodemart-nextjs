"use client";

import clsx from "clsx";
import { useState } from "react";
import { shop } from "@/lib/config";
import { money } from "@/lib/format";

export function ProductTabs({ description }: { description: string | null }) {
  const [tab, setTab] = useState<"description" | "shipping">("description");

  return (
    <div className="mt-10">
      <div className="flex gap-6 border-b border-slate-200" role="tablist">
        {(
          [
            ["description", "Description"],
            ["shipping", "Shipping & returns"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx(
              "-mb-px cursor-pointer border-b-2 pb-3 text-sm font-semibold transition",
              tab === key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "description" ? (
        // Descriptions are written by store admins in the admin panel.
        <div className="prose-shop pt-5 text-sm" dangerouslySetInnerHTML={{ __html: description || "<p>No description available.</p>" }} />
      ) : (
        <div className="prose-shop pt-5 text-sm">
          <p>Orders are dispatched within 24 hours and delivered in 2-4 working days across Pakistan.</p>
          <ul>
            <li>
              Free delivery on orders over {money(shop.freeShippingOver)}, otherwise {money(shop.shippingFee)}.
            </li>
            <li>Cash on delivery available nationwide.</li>
            <li>Easy 7-day returns on unused items in original packaging.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
