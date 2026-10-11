import { z } from "zod";

export const searchFiltersSchema = z
  .object({
    skills: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    seniority: z.array(z.string()).optional(),
    minYearsExperience: z.number().optional(),
    maxYearsExperience: z.number().optional(),
    companyType: z.array(z.string()).optional(),
    location: z
      .object({
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    openToWork: z.boolean().optional(),
  })
  .passthrough();

export const searchPaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const candidateSchema = z
  .object({
    id: z.string().min(1),
    fullName: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    headline: z.string().nullish(),
    currentTitle: z.string().nullish(),
    currentCompany: z.string().nullish(),
    currentCompanyLogoUrl: z.string().nullish(),
    role: z.string().nullish(),
    seniority: z.string().nullish(),
    yearsExperience: z.number().nullish(),
    locationCity: z.string().nullish(),
    locationState: z.string().nullish(),
    locationCountry: z.string().nullish(),
    openToWork: z.boolean().nullish(),
    skills: z.array(z.string()).nullish(),
  })
  .passthrough();

const apiEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data,
  });

const candidateSearchDataSchema = z
  .object({
    search_id: z.string().uuid(),
    filters: searchFiltersSchema,
    total: z.number().int().min(0).optional(),
    items: z.array(candidateSchema),
    pagination: searchPaginationSchema,
    searches_remaining: z.number().int().min(0).nullable(),
  })
  .transform((data) => ({
    ...data,
    total: data.total ?? data.pagination.total,
  }));

export const candidateSearchResponseSchema = apiEnvelope(candidateSearchDataSchema);

export const candidateSearchPageResponseSchema = apiEnvelope(
  z.object({
    search_id: z.string().uuid(),
    page: z.number().int().min(1),
    total: z.number().int().min(0).optional(),
    results: z.array(candidateSchema),
    pagination: searchPaginationSchema,
  }),
);

export const backendErrorSchema = z.object({
  success: z.literal(false).optional(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type SearchPagination = z.infer<typeof searchPaginationSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type CandidateSearchResponse = z.infer<typeof candidateSearchResponseSchema>["data"];
export type CandidateSearchPageResponse = z.infer<typeof candidateSearchPageResponseSchema>["data"];
