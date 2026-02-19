import { NextRequest } from "next/server";
import { POST as academicPOST } from "@/app/api/academic/sessions/[sessionId]/attendance/route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return academicPOST(request, {
    params: (async () => ({ sessionId: id }))(),
  });
}
