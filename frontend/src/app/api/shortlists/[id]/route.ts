import { NextResponse } from "next/server";
import { z } from "zod";

import { forwardAuthenticatedRequest } from "@/lib/server/backend-api";

const idSchema = z.string().uuid("Invalid shortlist ID");
const pageSchema = z.coerce.number().int().min(1).max(1_000_000).default(1);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  const parsedPage = pageSchema.safeParse(
    new URL(request.url).searchParams.get("page") ?? "1",
  );

  if (!parsedId.success || !parsedPage.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid shortlist ID or page number",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  return forwardAuthenticatedRequest(
    `/shortlists/${encodeURIComponent(parsedId.data)}?page=${parsedPage.data}`,
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const parsedId = idSchema.safeParse(id);

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

  return forwardAuthenticatedRequest(`/shortlists/${encodeURIComponent(parsedId.data)}`, {
    method: "DELETE",
  });
}

