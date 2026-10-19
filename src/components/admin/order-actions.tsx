"use client";

import { Banknote, ChevronDown, Loader2, Truck } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { changeOrderStatus, markOrderPaid } from "@/actions/admin";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/config";

export function OrderActions({ orderId, status, paid }: { orderId: number; status: OrderStatus; paid: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  function setStatus(next: OrderStatus) {
    setOpen(false);
    if (next === "cancelled" && !window.confirm("Cancel this order? Its stock will be returned to inventory.")) return;
    start(async () => {
      await changeOrderStatus(orderId, next);
      toast.success(`Order marked as ${ORDER_STATUS_LABELS[next]}.`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!paid && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markOrderPaid(orderId);
              toast.success("Payment marked as received.");
            })
          }
          className="btn !rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Banknote className="size-4" /> Mark paid
        </button>
      )}
      <div className="relative" ref={menu}>
        <button type="button" disabled={pending} onClick={() => setOpen((v) => !v)} className="btn-brand !rounded-lg" aria-expanded={open}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />} Update status <ChevronDown className="size-4" />
        </button>
        {open && (
          <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            {ORDER_STATUSES.filter((s) => s !== status).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-slate-50 ${s === "cancelled" ? "text-rose-600" : "text-slate-700"}`}
              >
                Mark as {ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
