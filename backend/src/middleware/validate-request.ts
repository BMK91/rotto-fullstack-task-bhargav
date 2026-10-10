import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { HTTP_STATUS } from "@/constants/http-status.js";
import { sendError } from "@/utils/send-error.js";

export function validateRequest(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid request data",
        code: "VALIDATION_ERROR",
        details,
      });

      return;
    }

    res.locals.validated = result.data;
    next();
  };
}
