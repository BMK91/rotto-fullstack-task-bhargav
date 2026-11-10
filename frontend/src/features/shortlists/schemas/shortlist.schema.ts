import { z } from "zod";

export const apiEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data,
  });

export const shortlistSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  candidateCount: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  hasCandidate: z.boolean().optional(),
});

export const shortlistCandidateItemSchema = z
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
    addedAt: z.string().nullish(),
  })
  .passthrough();

export const shortlistPaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const shortlistDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  companyId: z.string(),
  recruiterId: z.string(),
  candidateCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  candidates: z.array(shortlistCandidateItemSchema),
  pagination: shortlistPaginationSchema,
});

export const shortlistCandidateAssociationSchema = z.object({
  id: z.string(),
  shortlistId: z.string(),
  candidateId: z.string(),
  createdAt: z.string(),
});

export const shortlistsListResponseSchema = apiEnvelope(z.array(shortlistSummarySchema));
export const shortlistDetailsResponseSchema = apiEnvelope(shortlistDetailsSchema);
export const createShortlistResponseSchema = apiEnvelope(
  z.object({
    id: z.string(),
    companyId: z.string(),
    recruiterId: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);
export const addCandidateResponseSchema = apiEnvelope(shortlistCandidateAssociationSchema);

export const backendErrorSchema = z.object({
  success: z.literal(false).optional(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ShortlistSummary = z.infer<typeof shortlistSummarySchema>;
export type ShortlistCandidateItem = z.infer<typeof shortlistCandidateItemSchema>;
export type ShortlistDetails = z.infer<typeof shortlistDetailsSchema>;
export type ShortlistPagination = z.infer<typeof shortlistPaginationSchema>;
export type ShortlistCandidateAssociation = z.infer<typeof shortlistCandidateAssociationSchema>;

