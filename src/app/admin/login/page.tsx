import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { shop } from "@/lib/config";

export const metadata: Metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/30">
            <ShoppingBag className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">{shop.name} Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your store.</p>
        </div>
        <LoginForm admin />
      </div>
    </div>
  );
}
