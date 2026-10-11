import { NextResponse } from "next/server";
import { z } from "zod";

import { forwardAuthenticatedRequest } from "@/lib/server/backend-api";

const searchRequestSchema = z.object({
  brief: z.string().trim().min(1).max(2000),
}).strict();

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = searchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Enter a search brief between 1 and 2,000 characters.",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  return forwardAuthenticatedRequest("/search", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}
