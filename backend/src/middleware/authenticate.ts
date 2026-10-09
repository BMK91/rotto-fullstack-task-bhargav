import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

import { db } from "@/db/client.js";
import { recruiters } from "@/db/schema/recruiters.js";
import { supabaseAdmin } from "@/lib/supabase/admin.js";

export interface AuthenticatedRecruiter {
  id: string;
  authUserId: string;
  email: string;
  companyId: string;
}

declare global {
  namespace Express {
    interface Request {
      recruiter?: AuthenticatedRecruiter;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const [recruiter] = await db
      .select({
        id: recruiters.id,
        authUserId: recruiters.authUserId,
        email: recruiters.email,
        companyId: recruiters.companyId,
      })
      .from(recruiters)
      .where(eq(recruiters.authUserId, user.id))
      .limit(1);

    if (!recruiter) {
      res.status(403).json({
        success: false,
        message: "Recruiter access is not permitted",
        code: "FORBIDDEN",
      });
      return;
    }

    req.recruiter = recruiter;

    next();
  } catch (error) {
    next(error);
  }
}
