import { z } from "zod";

export const createSearchRequestSchema = z
  .object({
    brief: z
      .string()
      .trim()
      .min(1, "Search brief is required")
      .max(2000, "Search brief must not exceed 2000 characters"),
  })
  .strict();

export const searchFiltersSchema = z
  .object({
    skills: z.array(z.string().trim().min(1).max(100)).max(30).default([]),

    roles: z.array(z.string().trim().min(1).max(100)).max(20).default([]),

    seniority: z
      .array(z.enum(["junior", "mid", "senior", "staff", "lead", "principal"]))
      .max(6)
      .default([]),

    minYearsExperience: z.number().int().min(0).max(60).optional(),

    maxYearsExperience: z.number().int().min(0).max(60).optional(),

    companyType: z
      .array(z.enum(["startup", "enterprise"]))
      .max(2)
      .default([]),

    location: z
      .object({
        city: z.string().trim().min(1).max(100).optional(),
        state: z.string().trim().min(1).max(100).optional(),
        country: z.string().trim().min(1).max(100).optional(),
      })
      .strict()
      .optional(),

    openToWork: z.boolean().optional(),
  })
  .strict()
  .refine(
    (filters) =>
      filters.minYearsExperience === undefined ||
      filters.maxYearsExperience === undefined ||
      filters.minYearsExperience <= filters.maxYearsExperience,
    {
      message:
        "Minimum years of experience cannot exceed maximum years of experience",
      path: ["minYearsExperience"],
    },
  );

export const searchPaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  })
  .strict();

export const searchIdSchema = z.string().uuid();

export const SEARCH_PAGE_SIZE = 20;

export type CreateSearchRequest = z.infer<typeof createSearchRequestSchema>;

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export type SearchPagination = z.infer<typeof searchPaginationSchema>;
