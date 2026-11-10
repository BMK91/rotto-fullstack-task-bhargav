import { NextResponse } from "next/server";
import { z } from "zod";

import { forwardAuthenticatedRequest } from "@/lib/server/backend-api";

const idSchema = z.string().uuid("Invalid shortlist ID");
const addCandidateSchema = z
  .object({
    candidateId: z.string().trim().min(1, "Candidate ID is required"),
  })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  const body: unknown = await request.json().catch(() => null);
  const parsedBody = addCandidateSchema.safeParse(body);

  if (!parsedId.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid shortlist ID",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedBody.error.issues[0]?.message ?? "Invalid candidate ID",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  return forwardAuthenticatedRequest(
    `/shortlists/${encodeURIComponent(parsedId.data)}/candidates`,
    {
      method: "POST",
      body: JSON.stringify(parsedBody.data),
    },
  );
}

