import { NextResponse } from "next/server";
import { z } from "zod";

import { forwardAuthenticatedRequest } from "@/lib/server/backend-api";

const idSchema = z.string().uuid("Invalid shortlist ID");
const candidateIdSchema = z.string().trim().min(1, "Candidate ID is required");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> },
): Promise<NextResponse> {
  const { id, candidateId } = await params;
  const parsedId = idSchema.safeParse(id);
  const parsedCandidateId = candidateIdSchema.safeParse(candidateId);

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

  if (!parsedCandidateId.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid candidate ID",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  return forwardAuthenticatedRequest(
    `/shortlists/${encodeURIComponent(parsedId.data)}/candidates/${encodeURIComponent(parsedCandidateId.data)}`,
    {
      method: "DELETE",
    },
  );
}

