import type { ErrorRequestHandler, RequestHandler } from "express";

import { HTTP_STATUS } from "@/constants/http-status.js";
import { ApiError } from "@/errors/api-error.js";
import { sendError } from "@/utils/send-error.js";

export const notFoundHandler: RequestHandler = (req, res): void => {
  sendError(res, {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: `Route ${req.method} ${req.path} not found`,
    code: "ROUTE_NOT_FOUND",
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
): void => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof ApiError) {
    sendError(res, {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    });

    return;
  }

  const parserError = error as {
    status?: number;
    type?: string;
  } | null;

  if (parserError?.type === "entity.too.large") {
    sendError(res, {
      statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
      message: "Request body is too large",
      code: "PAYLOAD_TOO_LARGE",
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    parserError?.status === HTTP_STATUS.BAD_REQUEST
  ) {
    sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Malformed JSON request body",
      code: "INVALID_JSON",
    });
    return;
  }

  console.error("Unhandled API error:", error);

  sendError(res, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};
