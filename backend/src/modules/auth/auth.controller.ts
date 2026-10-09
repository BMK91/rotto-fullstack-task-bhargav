import type { Request, Response, NextFunction } from "express";

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
      res.status(400).json({
        success: false,
        message: "Valid email and password are required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    const result = await login({ email, password });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      if (error.code === "INVALID_CREDENTIALS") {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      if (error.code === "RECRUITER_NOT_FOUND") {
        res.status(403).json({
          success: false,
          message: "Recruiter access is not permitted",
          code: "FORBIDDEN",
        });
        return;
      }
    }

    next(error);
  }
}
