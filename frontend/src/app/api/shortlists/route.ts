import { NextResponse } from "next/server";
import { z } from "zod";

import { forwardAuthenticatedRequest } from "@/lib/server/backend-api";

const createShortlistSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  })
  .strict();

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get("candidateId");
  const path = candidateId
    ? `/shortlists?candidateId=${encodeURIComponent(candidateId)}`
    : "/shortlists";
  return forwardAuthenticatedRequest(path);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createShortlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid shortlist name",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  return forwardAuthenticatedRequest("/shortlists", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

