import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { companies } from "./companies.js";

export const recruiters = pgTable("recruiters", {
  id: uuid("id").defaultRandom().primaryKey(),

  authUserId: uuid("auth_user_id").notNull().unique(),

  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, {
      onDelete: "cascade",
    }),

  email: text("email").notNull().unique(),

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
});
