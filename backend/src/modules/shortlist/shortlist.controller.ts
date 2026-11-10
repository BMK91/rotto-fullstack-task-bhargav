import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "@/constants/http-status.js";
import { sendError } from "@/utils/send-error.js";
import { sendSuccess } from "@/utils/send-success.js";

import {
  addCandidateToShortlist,
  createShortlist,
  deleteShortlist,
  getShortlistDetails,
  getShortlists,
  removeCandidateFromShortlist,
} from "./shortlist.service.js";
import {
  addCandidateSchema,
  createShortlistSchema,
  removeCandidateParamsSchema,
  shortlistIdSchema,
  shortlistPaginationSchema,
} from "./shortlist.validator.js";

export async function createShortlistController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = createShortlistSchema.safeParse(req.body);

  if (!parsed.success) {
    sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const shortlist = await createShortlist({
      name: parsed.data.name,
      companyId: req.recruiter!.companyId,
      recruiterId: req.recruiter!.id,
    });

    sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Shortlist created successfully",
      data: shortlist,
    });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getShortlistsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const candidateId =
      typeof req.query.candidateId === "string"
        ? req.query.candidateId
        : undefined;
    const list = await getShortlists(req.recruiter!.companyId, candidateId);

    sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Shortlists retrieved successfully",
      data: list,
    });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getShortlistDetailsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsedId = shortlistIdSchema.safeParse(req.params.id);
  const parsedQuery = shortlistPaginationSchema.safeParse({
    page: req.query.page,
  });

  if (!parsedId.success || !parsedQuery.success) {
    const details: Array<{ path: string; message: string }> = [];

    if (!parsedId.success) {
      details.push(
        ...parsedId.error.issues.map((issue) => ({
          path: `params.${issue.path.join(".") || "id"}`,
          message: issue.message,
        })),
      );
    }

    if (!parsedQuery.success) {
      details.push(
        ...parsedQuery.error.issues.map((issue) => ({
          path: `query.${issue.path.join(".") || "page"}`,
          message: issue.message,
        })),
      );
    }

    sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details,
    });
    return;
  }

  try {
    const details = await getShortlistDetails(
      parsedId.data,
      req.recruiter!.companyId,
      parsedQuery.data.page,
    );

    sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Shortlist details retrieved successfully",
      data: details,
    });
  } catch (error: unknown) {
    next(error);
  }
}

export async function addCandidateController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsedId = shortlistIdSchema.safeParse(req.params.id);
  const parsedBody = addCandidateSchema.safeParse(req.body);

  if (!parsedId.success || !parsedBody.success) {
    const details: Array<{ path: string; message: string }> = [];

    if (!parsedId.success) {
      details.push(
        ...parsedId.error.issues.map((issue) => ({
          path: `params.${issue.path.join(".") || "id"}`,
          message: issue.message,
        })),
      );
    }

    if (!parsedBody.success) {
      details.push(
        ...parsedBody.error.issues.map((issue) => ({
          path: `body.${issue.path.join(".") || "candidateId"}`,
          message: issue.message,
        })),
      );
    }

    sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details,
    });
    return;
  }

  try {
    const association = await addCandidateToShortlist({
      shortlistId: parsedId.data,
      candidateId: parsedBody.data.candidateId,
      companyId: req.recruiter!.companyId,
    });

    sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Candidate added to shortlist successfully",
      data: association,
    });
  } catch (error: unknown) {
    next(error);
  }
}

export async function removeCandidateController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsedParams = removeCandidateParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: parsedParams.error.issues.map((issue) => ({
        path: `params.${issue.path.join(".")}`,
        message: issue.message,
      })),
    });
    return;
  }

  try {
    await removeCandidateFromShortlist({
      shortlistId: parsedParams.data.id,
      candidateId: parsedParams.data.candidateId,
      companyId: req.recruiter!.companyId,
    });

    sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Candidate removed from shortlist successfully",
    });
  } catch (error: unknown) {
    next(error);
  }
}

export async function deleteShortlistController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsedId = shortlistIdSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: parsedId.error.issues.map((issue) => ({
        path: `params.${issue.path.join(".") || "id"}`,
        message: issue.message,
      })),
    });
    return;
  }

  try {
    await deleteShortlist(parsedId.data, req.recruiter!.companyId);

    sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Shortlist deleted successfully",
    });
  } catch (error: unknown) {
    next(error);
  }
}

