/**
 * Database Query Helper Functions
 * Provides reusable patterns for common Prisma queries
 */

import { prisma } from "@/lib/prisma";

/**
 * Fetches a record and validates center access
 * @param model Prisma model delegate
 * @param id Record ID
 * @param userCenterId User's center ID
 * @param userRole User's role
 * @returns Record if found and accessible, null otherwise
 * @throws Error with "FORBIDDEN" message if center access denied
 */
export async function fetchWithCenterAccess<T extends { centerId?: string }>(
  model: {
    findUnique: (args: {
      where: { id: string };
      include?: unknown;
    }) => Promise<T | null>;
  },
  id: string,
  userCenterId: string,
  userRole: string,
  include?: unknown
): Promise<T | null> {
  const record = await model.findUnique({
    where: { id },
    ...(include !== undefined && include !== null ? { include } : {}),
  });

  if (!record) {
    return null;
  }

  // Super admin can access all centers
  if (userRole === "SUPER_ADMIN") {
    return record;
  }

  // Check center access for other roles
  if (record.centerId && record.centerId !== userCenterId) {
    throw new Error("FORBIDDEN");
  }

  return record;
}

/**
 * Gets the center ID for queries based on user role
 * SUPER_ADMIN can query all centers, others are scoped to their center
 */
export function getCenterIdForQuery(
  userRole: string,
  userCenterId: string
): string | undefined {
  return userRole === "SUPER_ADMIN" ? undefined : userCenterId;
}

/**
 * Creates a where clause for center-scoped queries
 */
export function centerWhereClause(userRole: string, userCenterId: string) {
  return userRole === "SUPER_ADMIN" ? {} : { centerId: userCenterId };
}

/**
 * Batch fetch users by IDs with center validation
 * @param userIds Array of user IDs to fetch
 * @param userCenterId User's center ID for validation
 * @param userRole User's role
 * @returns Array of users that belong to accessible centers
 */
export async function batchFetchUsers(
  userIds: string[],
  userCenterId: string,
  userRole: string
) {
  return await prisma.user.findMany({
    where: {
      id: { in: userIds },
      ...centerWhereClause(userRole, userCenterId),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      centerId: true,
    },
  });
}

/**
 * Batch fetch courses by IDs with center validation
 */
export async function batchFetchCourses(
  courseIds: string[],
  userCenterId: string,
  userRole: string
) {
  return await prisma.course.findMany({
    where: {
      id: { in: courseIds },
      ...centerWhereClause(userRole, userCenterId),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      centerId: true,
    },
  });
}

/**
 * Gets pagination parameters from URL search params
 */
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("perPage") || "10", 10))
  );
  const skip = (page - 1) * perPage;

  return { page, perPage, skip, take: perPage };
}
