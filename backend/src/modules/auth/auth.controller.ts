import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "@/constants/http-status.js";
import { sendError } from "@/utils/send-error.js";
import { sendSuccess } from "@/utils/send-success.js";
import { AuthServiceError, login } from "./auth.service.js";

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email?: unknown;
      password?: unknown;
    };

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: "Valid email and password are required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    const result = await login({ email, password });

    sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      if (error.code === "INVALID_CREDENTIALS") {
        sendError(res, {
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      if (error.code === "RECRUITER_NOT_FOUND") {
        sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: "Recruiter access is not permitted",
          code: "FORBIDDEN",
        });
        return;
      }
    }

    next(error);
  }
}

export function getMeController(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.recruiter) {
    sendError(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: "Authentication required",
      code: "UNAUTHORIZED",
    });

    return;
  }

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: "Recruiter fetched successfully",
    data: {
      id: req.recruiter.id,
      email: req.recruiter.email,
      companyId: req.recruiter.companyId,
      companyName: req.recruiter.companyName,
    },
  });
}
