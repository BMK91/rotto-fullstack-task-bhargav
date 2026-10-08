import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";

import { candidates } from "./candidates.js";

export const candidateEducation = pgTable("candidate_education", {
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

  school: text("school").notNull(),
  degree: text("degree"),
  field: text("field"),
  graduationYear: integer("graduation_year"),
});
