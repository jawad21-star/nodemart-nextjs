import { and, eq, lt } from "drizzle-orm";
import { Suspense } from "react";
import { db } from "@/db";
import { orders, products, reviews } from "@/db/schema";
import { SavedToast } from "@/components/admin/controls";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth";

// The whole admin panel is per-request and behind the admin session.
export const instant = false;

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [pendingOrders, lowStock, pendingReviews] = await Promise.all([
    db.$count(orders, eq(orders.status, "pending")),
    db.$count(products, and(lt(products.stock, 5), eq(products.isActive, true))),
    db.$count(reviews, eq(reviews.isApproved, false)),
  ]);

  return (
    <>
      <AdminSidebar badges={{ pendingOrders, lowStock, pendingReviews }} user={{ name: user.name, email: user.email }} />
      <SavedToast />
      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </>
  );
}

function AdminSkeleton() {
  return (
    <div className="lg:ml-64">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}
