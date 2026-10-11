import { z } from "zod";

import {
  backendErrorSchema,
  candidateSearchPageResponseSchema,
  candidateSearchResponseSchema,
  type CandidateSearchPageResponse,
  type CandidateSearchResponse,
} from "@/features/candidate-search/schemas/search.schema";

export class CandidateSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "CandidateSearchError";
  }
}

async function parseResponse<T extends z.ZodType>(
  response: Response,
  schema: T,
): Promise<z.infer<T>> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = backendErrorSchema.safeParse(payload);
    const message = parsedError.success
      ? parsedError.data.message
      : undefined;
    const code = parsedError.success ? parsedError.data.code : undefined;

    throw new CandidateSearchError(
      message ?? "The search request failed. Please try again.",
      response.status,
      code,
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new CandidateSearchError(
      "The search service returned data in an unexpected format.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return parsed.data;
}

export const candidateSearchService = {
  async submit(brief: string, signal?: AbortSignal): Promise<CandidateSearchResponse> {
    let response: Response;
    try {
      response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ brief }),
        cache: "no-store",
        signal,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new CandidateSearchError("Unable to connect to search. Check your connection and try again.");
    }

    const envelope = await parseResponse(response, candidateSearchResponseSchema);
    return envelope.data;
  },

  async getPage(
    searchId: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<CandidateSearchPageResponse> {
    let response: Response;
    try {
      response = await fetch(
        `/api/search/${encodeURIComponent(searchId)}?page=${page}`,
        { headers: { Accept: "application/json" }, cache: "no-store", signal },
      );
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new CandidateSearchError("Unable to load more candidates. Check your connection and try again.");
    }

    const envelope = await parseResponse(response, candidateSearchPageResponseSchema);
    return envelope.data;
  },
};
