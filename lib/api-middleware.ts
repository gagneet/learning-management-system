/**
 * API Middleware Utilities
 * Provides reusable authentication and authorization helpers for API routes
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export type AuthenticatedSession = Session & {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    centerId: string;
  };
};

/**
 * Requires authentication for API route
 * @returns Session if authenticated, or error response if not
 */
export async function requireAuth(): Promise<
  { session: AuthenticatedSession } | { error: NextResponse }
> {
  const session = await auth();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session: session as AuthenticatedSession };
}

/**
 * Checks if user has required role
 * @param userRole Current user's role
 * @param allowedRoles Array of allowed roles
 * @returns null if authorized, error response if not
 */
export function checkRole(
  userRole: string,
  allowedRoles: string[]
): NextResponse | null {
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Common role groups for authorization
 */
export const RoleGroups = {
  ADMIN: ["SUPER_ADMIN", "CENTER_ADMIN"],
  STAFF: ["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR", "TEACHER"],
  EDIT_ACCESS: [
    "SUPER_ADMIN",
    "CENTER_ADMIN",
    "CENTER_SUPERVISOR",
    "TEACHER",
  ],
  FINANCE: ["SUPER_ADMIN", "CENTER_ADMIN", "FINANCE_ADMIN"],
  ALL: [
    "SUPER_ADMIN",
    "CENTER_ADMIN",
    "CENTER_SUPERVISOR",
    "FINANCE_ADMIN",
    "TEACHER",
    "PARENT",
    "STUDENT",
  ],
} as const;

/**
 * Validates center access for a resource
 * @param userRole User's role
 * @param userCenterId User's center ID
 * @param resourceCenterId Resource's center ID
 * @returns null if authorized, error response if not
 */
export function checkCenterAccess(
  userRole: string,
  userCenterId: string,
  resourceCenterId: string
): NextResponse | null {
  if (userRole !== "SUPER_ADMIN" && userCenterId !== resourceCenterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
