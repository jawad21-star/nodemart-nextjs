import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };

// Reuse one connection across hot reloads in development.
const client = (globalForDb.libsql ??= createClient({
  url: process.env.DATABASE_URL ?? "file:data/shop.db",
}));

export const db = drizzle(client, { schema });
export { schema };
