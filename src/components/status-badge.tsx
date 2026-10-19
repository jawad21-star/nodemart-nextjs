import clsx from "clsx";
import { ORDER_STATUS_LABELS } from "@/lib/config";
import type { OrderStatus } from "@/db/schema";

const COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-sky-50 text-sky-700 ring-sky-200",
  shipped: "bg-brand-50 text-brand-700 ring-brand-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", COLORS[status])}>{ORDER_STATUS_LABELS[status]}</span>;
}

export function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "green" | "red" | "amber" | "brand" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    brand: "bg-brand-50 text-brand-700",
  };
  return <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", colors[color])}>{children}</span>;
}
