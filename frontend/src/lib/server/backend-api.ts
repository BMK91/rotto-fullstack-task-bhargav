import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function forwardAuthenticatedRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = (await cookies()).get("rotto_access_token")?.value;

  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "The candidate service is not configured.", code: "SERVICE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentication required.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to connect to the candidate service.", code: "UPSTREAM_UNAVAILABLE" },
      { status: 502 },
    );
  }

  const body: unknown = await upstream.json().catch(() => null);
  return NextResponse.json(
    body ?? {
      success: false,
      message: "The candidate service returned an invalid response.",
      code: "INVALID_UPSTREAM_RESPONSE",
    },
    { status: body === null && upstream.ok ? 502 : upstream.status },
  );
}
