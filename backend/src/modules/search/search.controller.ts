import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "@/constants/http-status.js";
import { sendError } from "@/utils/send-error.js";
import { sendSuccess } from "@/utils/send-success.js";
import { createSearchRequestSchema } from "@/validators/search.validator.js";

import { createCandidateSearch } from "./search.service.js";

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
    const result = await createCandidateSearch(parsed.data.brief);

    sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Search completed successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
}
