import { eq } from "drizzle-orm";

import { db } from "@/db/client.js";
import { companies, recruiters } from "@/db/schema/index.js";
import { createSupabaseAuthClient } from "@/lib/auth.js";

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthServiceError extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS" | "RECRUITER_NOT_FOUND",
  ) {
    super(code);
    this.name = "AuthServiceError";
  }
}

export async function login(input: LoginInput) {
  const supabase = createSupabaseAuthClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  if (error || !data.user || !data.session) {
    throw new AuthServiceError("INVALID_CREDENTIALS");
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
    .where(eq(recruiters.authUserId, data.user.id))
    .limit(1);

  if (!recruiter) {
    // Do not expose a valid Supabase account without a recruiter record.
    // Revoke this session rather than returning an application token.
    await supabase.auth.signOut({ scope: "local" });

    throw new AuthServiceError("RECRUITER_NOT_FOUND");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    tokenType: data.session.token_type,
    expiresIn: data.session.expires_in,
    recruiter: {
      id: recruiter.id,
      email: recruiter.email,
      companyId: recruiter.companyId,
      companyName: recruiter.companyName,
    },
  };
}
