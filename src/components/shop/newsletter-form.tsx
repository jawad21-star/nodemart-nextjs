"use client";

import { toast } from "sonner";

export function NewsletterForm() {
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.currentTarget.reset();
        toast.success("Thanks for subscribing!");
      }}
    >
      <input
        type="email"
        required
        placeholder="you@email.com"
        aria-label="Email address"
        className="w-full min-w-0 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
      />
      <button className="btn-brand shrink-0 !px-4">Join</button>
    </form>
  );
}
