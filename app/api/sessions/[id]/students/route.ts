import { NextRequest } from "next/server";
import {
  GET as academicGET,
  POST as academicPOST,
} from "@/app/api/academic/sessions/[sessionId]/students/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return academicGET(request, {
    params: (async () => ({ sessionId: id }))(),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return academicPOST(request, {
    params: (async () => ({ sessionId: id }))(),
  });
}
