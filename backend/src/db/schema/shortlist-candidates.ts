import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { candidates } from "./candidates.js";
import { shortlists } from "./shortlists.js";

export const shortlistCandidates = pgTable(
  "shortlist_candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    shortlistId: uuid("shortlist_id")
      .notNull()
      .references(() => shortlists.id, {
        onDelete: "cascade",
      }),

    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("shortlist_candidates_shortlist_id_candidate_id_unique").on(
      table.shortlistId,
      table.candidateId,
    ),
    index("shortlist_candidates_shortlist_id_idx").on(table.shortlistId),
    index("shortlist_candidates_candidate_id_idx").on(table.candidateId),
  ],
);

