import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { recruiters } from "./recruiters.js";

export const shortlists = pgTable(
  "shortlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    recruiterId: uuid("recruiter_id")
      .notNull()
      .references(() => recruiters.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 100 }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("shortlists_company_id_idx").on(table.companyId),
  ],
);

