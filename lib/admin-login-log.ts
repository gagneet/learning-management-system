import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "CENTER_ADMIN"];

export interface AdminLoginLogContext {
  ipAddress?: string | null;
  ipCountry?: string | null;
  forwardedFor?: string | null;
  userAgent?: string | null;
  cfRay?: string | null;
}

export function extractAdminLoginContext(request?: Request): AdminLoginLogContext {
  if (!request) {
    return {};
  }

  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");

  return {
    ipAddress:
      headers.get("cf-connecting-ip") ||
      (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null),
    ipCountry: headers.get("cf-ipcountry"),
    forwardedFor,
    userAgent: headers.get("user-agent"),
    cfRay: headers.get("cf-ray"),
  };
}

interface CreateAdminLoginLogInput {
  userId?: string | null;
  userName?: string | null;
  email: string;
  role: Role;
  centreId: string;
  success: boolean;
  failureReason?: string | null;
  context?: AdminLoginLogContext;
}

export async function createAdminLoginLog(
  input: CreateAdminLoginLogInput
): Promise<void> {
  if (!ADMIN_ROLES.includes(input.role)) {
    return;
  }

  try {
    await prisma.adminLoginLog.create({
      data: {
        userId: input.userId || null,
        userName: input.userName || null,
        email: input.email,
        role: input.role,
        centreId: input.centreId,
        ipAddress: input.context?.ipAddress || undefined,
        ipCountry: input.context?.ipCountry || undefined,
        forwardedFor: input.context?.forwardedFor || undefined,
        userAgent: input.context?.userAgent || undefined,
        cfRay: input.context?.cfRay || undefined,
        success: input.success,
        failureReason: input.failureReason || null,
      },
    });
  } catch (error) {
    console.error("Failed to create admin login log:", error);
  }
}

export function isAdminRole(role: Role) {
  return ADMIN_ROLES.includes(role);
}
