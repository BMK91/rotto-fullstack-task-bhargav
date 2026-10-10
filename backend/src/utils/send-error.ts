import type { Response } from "express";

import { HTTP_STATUS } from "@/constants/http-status.js";

interface ErrorDetail {
  path: string;
  message: string;
}

interface SendErrorOptions {
  statusCode?: number;
  message: string;
  code: string;
  details?: ErrorDetail[];
}

export function sendError(res: Response, options: SendErrorOptions): void {
  const {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message,
    code,
    details,
  } = options;

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(details ? { details } : {}),
  });
}
