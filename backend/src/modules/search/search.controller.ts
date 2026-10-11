import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "@/constants/http-status.js";
import { sendError } from "@/utils/send-error.js";
import { sendSuccess } from "@/utils/send-success.js";
import {
  createSearchRequestSchema,
  searchIdSchema,
  searchPaginationSchema,
} from "@/validators/search.validator.js";

import {
  createCandidateSearch,
  getCandidateSearchPage,
} from "./search.service.js";

export async function createSearchController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = createSearchRequestSchema.safeParse(req.body);

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
    const result = await createCandidateSearch(
      parsed.data.brief,
      req.recruiter!.companyId,
    );

    sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Search completed successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getSearchPageController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const searchId = searchIdSchema.safeParse(req.params.search_id);
  const query = searchPaginationSchema.safeParse({ page: req.query.page });

  if (!searchId.success || !query.success) {
    sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Invalid search id or page",
      code: "VALIDATION_ERROR",
      details: [
        ...(!searchId.success
          ? [{ path: "search_id", message: "Search id must be a UUID" }]
          : []),
        ...(!query.success
          ? [{ path: "page", message: "Page must be a positive integer" }]
          : []),
      ],
    });
    return;
  }

  try {
    const result = await getCandidateSearchPage(
      searchId.data,
      req.recruiter!.companyId,
      query.data.page,
    );
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: unknown) {
    next(error);
  }
}
