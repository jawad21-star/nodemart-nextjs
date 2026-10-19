"use client";

import { useState } from "react";
import { money } from "@/lib/format";

type Point = { label: string; revenue: number; orders: number };

/** 30-day revenue bars with an order-count line; hover shows the day's numbers. */
export function SalesChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));
  const step = innerW / data.length;
  const barW = Math.max(4, step * 0.62);

  const linePoints = data
    .map((d, i) => `${pad.left + i * step + step / 2},${pad.top + innerH - (d.orders / maxOrders) * innerH}`)
    .join(" ");

  const active = hover !== null ? data[hover] : null;
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-4">
        <div className="flex gap-8">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="size-2.5 rounded-sm bg-brand-500" /> Revenue
            </p>
            <p className="text-lg font-bold text-slate-900">{money(active ? active.revenue : totalRevenue)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="h-0.5 w-3 rounded bg-amber-500" /> Orders
            </p>
            <p className="text-lg font-bold text-slate-900">{active ? active.orders : totalOrders}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">{active ? active.label : "Last 30 days"}</p>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Revenue and orders over the last 30 days" onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad.left} x2={width - pad.right} y1={pad.top + innerH * (1 - f)} y2={pad.top + innerH * (1 - f)} stroke="#e2e8f0" strokeDasharray="3 4" />
        ))}
        {data.map((d, i) => {
          const h = (d.revenue / maxRevenue) * innerH;
          const x = pad.left + i * step + (step - barW) / 2;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)}>
              <rect x={pad.left + i * step} y={pad.top} width={step} height={innerH} fill="transparent" />
              <rect x={x} y={pad.top + innerH - h} width={barW} height={Math.max(h, d.revenue ? 2 : 0)} rx={3} className={hover === null || hover === i ? "fill-brand-500" : "fill-brand-200"} />
              {i % 5 === 0 && (
                <text x={pad.left + i * step + step / 2} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
        <polyline points={linePoints} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinejoin="round" pointerEvents="none" />
        {hover !== null && (
          <circle cx={pad.left + hover * step + step / 2} cy={pad.top + innerH - (data[hover].orders / maxOrders) * innerH} r={4} fill="#f59e0b" stroke="white" strokeWidth={2} pointerEvents="none" />
        )}
      </svg>
    </div>
  );
}
