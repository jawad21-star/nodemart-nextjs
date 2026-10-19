"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

/** Switch that calls a Server Action with the new value. */
export function ActionSwitch({ checked, action, label }: { checked: boolean; action: (value: boolean) => Promise<void>; label: string }) {
  const [value, setValue] = useOptimistic(checked);
  const [, start] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() =>
        start(async () => {
          setValue(!value);
          await action(!value);
        })
      }
      className={clsx("relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition", value ? "bg-brand-600" : "bg-slate-300")}
    >
      <span className={clsx("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition", value && "translate-x-5")} />
    </button>
  );
}

/** Button that runs a Server Action, optionally after a confirm() prompt. */
export function ActionButton({
  action,
  children,
  confirm: confirmText,
  success,
  className = "btn-outline !px-3 !py-1.5 text-xs",
  title,
}: {
  action: () => Promise<void>;
  children: ReactNode;
  confirm?: string;
  success?: string;
  className?: string;
  title?: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={pending}
      className={className}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          await action();
          if (success) toast.success(success);
        });
      }}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/** Shows a toast after a redirect with ?saved=1, then cleans the URL. */
export function SavedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (params.get("saved") !== "1") return;
    toast.success("Saved successfully.");
    const next = new URLSearchParams(params);
    next.delete("saved");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
