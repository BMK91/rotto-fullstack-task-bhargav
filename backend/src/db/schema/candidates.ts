import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const candidates = pgTable("candidates", {
  id: text("id").primaryKey(),

  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  headline: text("headline"),

  currentTitle: text("current_title").notNull(),
  currentCompany: text("current_company").notNull(),
  currentCompanyLogoUrl: text("current_company_logo_url"),

  role: text("role").notNull(),
  seniority: text("seniority").notNull(),
  yearsExperience: integer("years_experience").notNull(),

  locationCity: text("location_city").notNull(),
  locationState: text("location_state").notNull(),
  locationCountry: text("location_country").notNull(),

  openToWork: boolean("open_to_work").notNull().default(false),

  skills: text("skills").array().notNull().default([]),

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
