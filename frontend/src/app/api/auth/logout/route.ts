import { NextResponse } from "next/server";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set("rotto_access_token", "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set("rotto_refresh_token", "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set("rotto_recruiter", "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
