import { Suspense } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth";

// Account pages always depend on the signed-in user.
export const instant = false;

async function Gate({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="mt-8 flex flex-col gap-8 lg:flex-row">
      <AccountNav name={user.name} email={user.email} isAdmin={user.isAdmin} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-shop py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My account</h1>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-slate-100" />}>
        <Gate>{children}</Gate>
      </Suspense>
    </div>
  );
}
