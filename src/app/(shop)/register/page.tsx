import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { shop } from "@/lib/config";

export const metadata: Metadata = { title: "Create account" };

async function Gate({ searchParams }: { searchParams: PageProps<"/register">["searchParams"] }) {
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : undefined;
  if (await getCurrentUser()) redirect(target ?? "/account");
  return <RegisterForm next={target} />;
}

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <div className="container-shop flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-500">Join {shop.name} for exclusive deals.</p>
        </div>
        <Suspense fallback={<div className="card mt-8 h-96 animate-pulse bg-slate-50" />}>
          <Gate searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
