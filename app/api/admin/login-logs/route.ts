import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, RoleGroups } from "@/lib/api-middleware";
import { paginatedResponse, errorResponse } from "@/lib/api-utils";
import { getCentreIdForQuery } from "@/lib/tenancy";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { session } = authResult;
    const roleError = checkRole(session.user.role, RoleGroups.ADMIN);
    if (roleError) {
      return roleError;
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "20");
    const success = searchParams.get("success");
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const requestedCentreId = searchParams.get("centreId") || undefined;

    const centreId = getCentreIdForQuery(session, requestedCentreId);

    const where: {
      centreId: string;
      success?: boolean;
      email?: { contains: string; mode: "insensitive" };
      userId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      centreId,
    };

    if (success === "true") {
      where.success = true;
    }
    if (success === "false") {
      where.success = false;
    }
    if (email) {
      where.email = { contains: email, mode: "insensitive" };
    }
    if (userId) {
      where.userId = userId;
    }
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.adminLoginLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.adminLoginLog.count({ where }),
    ]);

    return paginatedResponse(items, total, page, perPage);
  } catch (error) {
    console.error("Error fetching admin login logs:", error);
    return errorResponse("Failed to fetch login logs");
  }
}
