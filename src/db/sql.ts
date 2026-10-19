import { getTableName, sql, type Column } from "drizzle-orm";

/**
 * A column reference that always includes its table name.
 * Drizzle drops the table prefix in single-table selects, which breaks
 * correlated subqueries like `where products.category_id = categories.id`.
 */
export function qualified(column: Column) {
  return sql.raw(`"${getTableName(column.table)}"."${column.name}"`);
}
