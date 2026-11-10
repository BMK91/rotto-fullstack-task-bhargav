import { z } from "zod";

import {
  addCandidateResponseSchema,
  backendErrorSchema,
  createShortlistResponseSchema,
  shortlistDetailsResponseSchema,
  shortlistsListResponseSchema,
  type ShortlistCandidateAssociation,
  type ShortlistDetails,
  type ShortlistSummary,
} from "@/features/shortlists/schemas/shortlist.schema";

export class ShortlistServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ShortlistServiceError";
  }
}

async function parseResponse<T extends z.ZodType>(
  response: Response,
  schema: T,
): Promise<z.infer<T>> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = backendErrorSchema.safeParse(payload);
    const message = parsedError.success ? parsedError.data.message : undefined;
    const code = parsedError.success ? parsedError.data.code : undefined;

    throw new ShortlistServiceError(
      message ?? "The shortlist request failed. Please try again.",
      response.status,
      code,
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ShortlistServiceError(
      "The shortlist service returned data in an unexpected format.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return parsed.data;
}

export const shortlistService = {
  async getShortlists(
    candidateId ?: string,
    signal ?: AbortSignal,
  ): Promise < ShortlistSummary[] > {
    let response: Response;
    try {
        const url = candidateId
          ? `/api/shortlists?candidateId=${encodeURIComponent(candidateId)}`
          : "/api/shortlists";
        response = await fetch(url, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal,
        });
      } catch(error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ShortlistServiceError("Unable to load shortlists. Check your connection.");
      }

    const envelope = await parseResponse(response, shortlistsListResponseSchema);
      return envelope.data;
    },

    async createShortlist(
      name: string,
      signal?: AbortSignal,
    ): Promise<{ id: string; name: string }> {
      let response: Response;
      try {
        response = await fetch("/api/shortlists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ name }),
          cache: "no-store",
          signal,
        });
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ShortlistServiceError("Unable to create shortlist. Check your connection.");
      }

      const envelope = await parseResponse(response, createShortlistResponseSchema);
      return envelope.data;
    },

    async getShortlistDetails(
      id: string,
      page: number = 1,
      signal?: AbortSignal,
    ): Promise<ShortlistDetails> {
      let response: Response;
      try {
        response = await fetch(
          `/api/shortlists/${encodeURIComponent(id)}?page=${page}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal,
          },
        );
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ShortlistServiceError("Unable to load shortlist details. Check your connection.");
      }

      const envelope = await parseResponse(response, shortlistDetailsResponseSchema);
      return envelope.data;
    },

    async addCandidate(
      shortlistId: string,
      candidateId: string,
      signal?: AbortSignal,
    ): Promise<ShortlistCandidateAssociation> {
      let response: Response;
      try {
        response = await fetch(
          `/api/shortlists/${encodeURIComponent(shortlistId)}/candidates`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ candidateId }),
            cache: "no-store",
            signal,
          },
        );
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ShortlistServiceError("Unable to add candidate to shortlist.");
      }

      const envelope = await parseResponse(response, addCandidateResponseSchema);
      return envelope.data;
    },

    async removeCandidate(
      shortlistId: string,
      candidateId: string,
      signal?: AbortSignal,
    ): Promise<void> {
      let response: Response;
      try {
        response = await fetch(
          `/api/shortlists/${encodeURIComponent(shortlistId)}/candidates/${encodeURIComponent(candidateId)}`,
          {
            method: "DELETE",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal,
          },
        );
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ShortlistServiceError("Unable to remove candidate from shortlist.");
      }

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const parsedError = backendErrorSchema.safeParse(payload);
        throw new ShortlistServiceError(
          parsedError.success ? (parsedError.data.message ?? "Failed to remove candidate.") : "Failed to remove candidate.",
          response.status,
          parsedError.success ? parsedError.data.code : undefined,
        );
      }
    },

    async deleteShortlist(
      shortlistId: string,
      signal?: AbortSignal,
    ): Promise<void> {
      let response: Response;
      try {
        response = await fetch(
          `/api/shortlists/${encodeURIComponent(shortlistId)}`,
          {
            method: "DELETE",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal,
          },
        );
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new ShortlistServiceError("Unable to delete shortlist.");
      }

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const parsedError = backendErrorSchema.safeParse(payload);
        throw new ShortlistServiceError(
          parsedError.success ? (parsedError.data.message ?? "Failed to delete shortlist.") : "Failed to delete shortlist.",
          response.status,
          parsedError.success ? parsedError.data.code : undefined,
        );
      }
    },
  };

