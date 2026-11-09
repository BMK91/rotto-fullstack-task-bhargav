import { HTTP_STATUS } from "@/constants/http-status.js";
import { ApiError } from "@/errors/api-error.js";

import {
  createShortlistRecord,
  deleteCandidateFromShortlist,
  deleteShortlistRecord,
  findCandidateById,
  findShortlistByIdAndCompany,
  findShortlistCandidateAssociation,
  getCompanyShortlists,
  getShortlistCandidatesPaginated,
  insertCandidateToShortlist,
} from "./shortlist.repository.js";
import type {
  AddCandidateInput,
  CreateShortlistInput,
  RemoveCandidateInput,
  Shortlist,
  ShortlistCandidateAssociation,
  ShortlistDetails,
  ShortlistSummary,
} from "./shortlist.types.js";
import { SHORTLIST_PAGE_SIZE } from "./shortlist.validator.js";

export async function createShortlist(
  input: CreateShortlistInput,
): Promise<Shortlist> {
  const trimmedName = input.name.trim();

  return await createShortlistRecord({
    name: trimmedName,
    companyId: input.companyId,
    recruiterId: input.recruiterId,
  });
}

export async function getShortlists(
  companyId: string,
): Promise<ShortlistSummary[]> {
  return await getCompanyShortlists(companyId);
}

export async function getShortlistDetails(
  id: string,
  companyId: string,
  page: number = 1,
): Promise<ShortlistDetails> {
  const shortlist = await findShortlistByIdAndCompany(id, companyId);

  if (!shortlist) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "SHORTLIST_NOT_FOUND",
      "Shortlist not found",
    );
  }

  const { candidates, total } = await getShortlistCandidatesPaginated(
    id,
    page,
    SHORTLIST_PAGE_SIZE,
  );

  const totalPages = Math.ceil(total / SHORTLIST_PAGE_SIZE);

  return {
    id: shortlist.id,
    name: shortlist.name,
    companyId: shortlist.companyId,
    recruiterId: shortlist.recruiterId,
    candidateCount: total,
    createdAt: shortlist.createdAt,
    updatedAt: shortlist.updatedAt,
    candidates,
    pagination: {
      page,
      pageSize: SHORTLIST_PAGE_SIZE,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function addCandidateToShortlist(
  input: AddCandidateInput,
): Promise<ShortlistCandidateAssociation> {
  const shortlist = await findShortlistByIdAndCompany(
    input.shortlistId,
    input.companyId,
  );

  if (!shortlist) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "SHORTLIST_NOT_FOUND",
      "Shortlist not found",
    );
  }

  const candidate = await findCandidateById(input.candidateId);

  if (!candidate) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "CANDIDATE_NOT_FOUND",
      "Candidate not found",
    );
  }

  const existing = await findShortlistCandidateAssociation(
    input.shortlistId,
    input.candidateId,
  );

  if (existing) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "DUPLICATE_CANDIDATE",
      "Candidate is already added to this shortlist",
    );
  }

  try {
    return await insertCandidateToShortlist(
      input.shortlistId,
      input.candidateId,
    );
  } catch (error: unknown) {
    const dbError = error as { code?: string; cause?: { code?: string } };
    const pgCode = dbError?.code ?? dbError?.cause?.code;
    if (pgCode === "23505") {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "DUPLICATE_CANDIDATE",
        "Candidate is already added to this shortlist",
      );
    }
    throw error;
  }
}

export async function removeCandidateFromShortlist(
  input: RemoveCandidateInput,
): Promise<void> {
  const shortlist = await findShortlistByIdAndCompany(
    input.shortlistId,
    input.companyId,
  );

  if (!shortlist) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "SHORTLIST_NOT_FOUND",
      "Shortlist not found",
    );
  }

  const removed = await deleteCandidateFromShortlist(
    input.shortlistId,
    input.candidateId,
  );

  if (!removed) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "CANDIDATE_NOT_IN_SHORTLIST",
      "Candidate is not in this shortlist",
    );
  }
}

export async function deleteShortlist(
  id: string,
  companyId: string,
): Promise<void> {
  const shortlist = await findShortlistByIdAndCompany(id, companyId);

  if (!shortlist) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      "SHORTLIST_NOT_FOUND",
      "Shortlist not found",
    );
  }

  await deleteShortlistRecord(id, companyId);
}
