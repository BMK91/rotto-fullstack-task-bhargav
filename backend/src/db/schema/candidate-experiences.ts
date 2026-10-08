import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";

import { candidates } from "./candidates.js";

export const candidateExperiences = pgTable("candidate_experiences", {
  id: bigint("id", {
    mode: "number",
  })
    .generatedAlwaysAsIdentity()
    .primaryKey(),

  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id, {
      onDelete: "cascade",
    }),

  title: text("title").notNull(),
  company: text("company").notNull(),
  companyLogoUrl: text("company_logo_url"),
  companyType: text("company_type"),

  startYear: integer("start_year"),
  endYear: integer("end_year"),

  description: text("description"),
});
