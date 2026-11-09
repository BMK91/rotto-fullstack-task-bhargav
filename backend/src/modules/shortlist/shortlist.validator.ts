import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const CANDIDATE_CODE_REGEX = /^cand_[a-zA-Z0-9_-]+$/;

export const shortlistIdSchema = z
  .string()
  .trim()
  .uuid("Invalid shortlist UUID");

export const candidateIdSchema = z
  .string()
  .trim()
  .min(1, "Candidate ID is required")
  .max(100, "Candidate ID must not exceed 100 characters")
  .refine(
    (val) => UUID_REGEX.test(val) || CANDIDATE_CODE_REGEX.test(val),
    {
      message: "Invalid candidate UUID",
    },
  );

export const createShortlistSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(100, "Name cannot exceed 100 characters"),
  })
  .strict();

export const addCandidateSchema = z
  .object({
    candidateId: candidateIdSchema,
  })
  .strict();

export const shortlistDetailsParamsSchema = z.object({
  id: shortlistIdSchema,
});

export const removeCandidateParamsSchema = z.object({
  id: shortlistIdSchema,
  candidateId: candidateIdSchema,
});

export const shortlistPaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  })
  .strict();

export const SHORTLIST_PAGE_SIZE = 20;

export type CreateShortlistInputBody = z.infer<typeof createShortlistSchema>;
export type AddCandidateInputBody = z.infer<typeof addCandidateSchema>;
export type ShortlistPaginationQuery = z.infer<typeof shortlistPaginationSchema>;
