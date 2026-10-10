import type { Response } from "express";

interface SendSuccessOptions<T> {
  statusCode?: number;
  message: string;
  data?: T;
}

export function sendSuccess<T>(
  res: Response,
  options: SendSuccessOptions<T>,
): void {
  const { statusCode = 200, message, data } = options;

  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
}
