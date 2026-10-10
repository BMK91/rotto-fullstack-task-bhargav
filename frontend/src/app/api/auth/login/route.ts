import { NextResponse } from "next/server";
import { z } from "zod";

const loginResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    tokenType: z.literal("bearer"),
    expiresIn: z.number().int().positive(),
    recruiter: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      companyId: z.string().uuid(),
      companyName: z.string().min(1),
    }),
  }),
});

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { message: "Authentication service is not configured." },
      { status: 500 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const credentials = credentialsSchema.safeParse(body);

  if (!credentials.success) {
    return NextResponse.json(
      { message: "Invalid login input." },
      { status: 400 },
    );
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials.data),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the authentication service." },
      { status: 502 },
    );
  }

  const payload: unknown = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: backendResponse.status },
    );
  }

  const parsed = loginResponseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid authentication response from server." },
      { status: 502 },
    );
  }

  const { accessToken, refreshToken, expiresIn, recruiter } = parsed.data.data;

  const response = NextResponse.json({
    success: true,
    message: "Login successful",
    data: { recruiter },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set("rotto_access_token", accessToken, {
    ...cookieOptions,
    maxAge: expiresIn,
  });

  // Keep the refresh token inaccessible to client-side JavaScript.
  response.cookies.set("rotto_refresh_token", refreshToken, {
    ...cookieOptions,
  });

  response.cookies.set("rotto_recruiter", JSON.stringify(recruiter), {
    ...cookieOptions,
    maxAge: expiresIn,
  });

  return response;
}
