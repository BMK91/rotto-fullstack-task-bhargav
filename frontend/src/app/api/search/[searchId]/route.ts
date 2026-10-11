import { NextResponse } from "next/server";
import { z } from "zod";

import { forwardAuthenticatedRequest } from "@/lib/server/backend-api";

const searchIdSchema = z.string().uuid();
const pageSchema = z.coerce.number().int().min(1).max(1_000_000);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ searchId: string }> },
): Promise<NextResponse> {
  const { searchId } = await params;
  const parsedId = searchIdSchema.safeParse(searchId);
  const parsedPage = pageSchema.safeParse(
    new URL(request.url).searchParams.get("page") ?? "1",
  );

  if (!parsedId.success || !parsedPage.success) {
    return NextResponse.json(
      { success: false, message: "The search id or page number is invalid.", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  return forwardAuthenticatedRequest(
    `/search/${encodeURIComponent(parsedId.data)}?page=${parsedPage.data}`,
  );
}
