import { NextRequest } from "next/server";
import {
  GET as academicGET,
  PUT as academicPUT,
} from "@/app/api/academic/sessions/[sessionId]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return academicGET(request, {
    params: (async () => ({ sessionId: id }))(),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return academicPUT(request, {
    params: (async () => ({ sessionId: id }))(),
  });
}
