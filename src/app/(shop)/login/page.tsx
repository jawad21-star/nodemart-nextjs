import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

async function Gate({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : undefined;
  if (await getCurrentUser()) redirect(target ?? "/account");
  return <LoginForm next={target} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="container-shop flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-500">Sign in to track orders and checkout faster.</p>
        </div>
        <Suspense fallback={<div className="card mt-8 h-80 animate-pulse bg-slate-50" />}>
          <Gate searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
