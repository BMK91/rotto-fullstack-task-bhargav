import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { SearchFilters } from "@/validators/search.validator.js";

import { companies } from "./companies.js";

export const searchRuns = pgTable("search_runs", {
  id: uuid("id").defaultRandom().primaryKey(),

  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),

  brief: text("brief").notNull(),

  filters: jsonb("filters").$type<SearchFilters>().notNull(),

  resultIds: jsonb("result_ids").$type<string[]>().notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
