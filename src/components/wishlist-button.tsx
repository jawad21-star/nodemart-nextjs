"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleWishlist } from "@/actions/account";

export function WishlistButton({ productId, initial, className }: { productId: number; initial: boolean; className?: string }) {
  const router = useRouter();
  const [active, setActive] = useOptimistic(initial);
  const [, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setActive(!active);
      const result = await toggleWishlist(productId);
      if ("signIn" in result) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      toast.success(result.added ? "Added to your wishlist" : "Removed from your wishlist");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={clsx(
        "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border transition",
        active ? "border-rose-300 bg-rose-50 text-rose-500" : "border-slate-300 text-slate-600 hover:border-rose-300 hover:text-rose-500",
        className,
      )}
    >
      <Heart className={clsx("size-5", active && "fill-current")} />
    </button>
  );
}
