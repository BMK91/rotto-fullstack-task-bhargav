import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "@/constants/http-status.js";
import { db } from "@/db/client.js";
import { companies } from "@/db/schema/companies.js";
import { recruiters } from "@/db/schema/recruiters.js";
import { supabaseAdmin } from "@/lib/supabase/admin.js";
import { sendError } from "@/utils/send-error.js";

export interface AuthenticatedRecruiter {
  id: string;
  authUserId: string;
  email: string;
  companyId: string;
  companyName: string;
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
      sendError(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      sendError(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
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
      sendError(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
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
        companyName: companies.name,
      })
      .from(recruiters)
      .innerJoin(companies, eq(recruiters.companyId, companies.id))
      .where(eq(recruiters.authUserId, user.id))
      .limit(1);

    if (!recruiter) {
      sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
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
