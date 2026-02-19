import { NextRequest } from "next/server";
import { PATCH as academicPATCH } from "@/app/api/academic/sessions/[sessionId]/mode/route";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return academicPATCH(request, {
    params: (async () => ({ sessionId: id }))(),
  });
}
