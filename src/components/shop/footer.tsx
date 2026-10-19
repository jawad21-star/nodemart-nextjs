import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { getNavCategories } from "@/lib/catalog";
import { shop } from "@/lib/config";
import { Logo } from "./header";
import { NewsletterForm } from "./newsletter-form";

export async function Footer() {
  const categories = await getNavCategories();

  return (
    <footer className="mt-24 bg-slate-950 text-slate-400">
      <div className="container-shop grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo dark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Your one-stop shop for electronics, fashion, beauty and home essentials. Genuine products, fast delivery and easy returns.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="size-4" /> {shop.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4" /> {shop.email}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="transition hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Account</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ["/account", "My account"],
              ["/account", "Order history"],
              ["/account/wishlist", "Wishlist"],
              ["/cart", "Cart"],
            ].map(([href, label]) => (
              <li key={label}>
                <Link href={href} className="transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Newsletter</h4>
          <p className="mt-4 text-sm">Get exclusive deals and new arrivals in your inbox.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container-shop flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>
            &copy; {shop.name}. All rights reserved.
          </p>
          <p>Cash on Delivery · Bank Transfer</p>
        </div>
      </div>
    </footer>
  );
}
