import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories } from "@/db/schema";

/** Category and brand options for admin product forms (uncached: admins see live data). */
export async function productFormOptions() {
  const [categoryOptions, brandOptions] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name)),
  ]);
  return { categories: categoryOptions, brands: brandOptions };
}
