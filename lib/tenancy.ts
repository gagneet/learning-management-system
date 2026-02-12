/**
 * Multi-Tenancy Helper
 * 
 * Provides utilities to enforce centre-based data isolation.
 * CRITICAL: centreId MUST come from session ONLY, never from request.
 */

interface Session {
  user: {
    id: string;
    role: string;
    centerId: string;  // Match NextAuth session spelling
    [key: string]: any;
  };
}

/**
 * Get the centreId for database queries
 * 
 * SUPER_ADMIN can query across centres if they provide a centreId.
 * All other roles are locked to their own centre.
 * 
 * @param session - User session
 * @param requestedCentreId - Optional centreId from query params (SUPER_ADMIN only)
 * @returns The centreId to use for filtering
 * 
 * @example
 * // For SUPER_ADMIN querying specific centre
 * const centreId = getCentreIdForQuery(session, query.centreId);
 * 
 * // For all other users (always their own centre)
 * const centreId = getCentreIdForQuery(session);
 */
export function getCentreIdForQuery(
  session: Session | null,
  requestedCentreId?: string
): string {
  if (!session?.user?.centreId) {
    throw new Error("UNAUTHORIZED");
  }

  // SUPER_ADMIN can query other centres
  if (session.user.role === "SUPER_ADMIN" && requestedCentreId) {
    return requestedCentreId;
  }

  // Everyone else locked to their centre
  return session.user.centerId;
}

/**
 * Validate that a resource belongs to the user's centre
 * 
 * @param session - User session
 * @param resourceCentreId - The centreId of the resource being accessed
 * @throws Error if resource is from different centre (unless SUPER_ADMIN)
 * 
 * @example
 * const invoice = await prisma.invoice.findUnique({ where: { id } });
 * validateCentreAccess(session, invoice.centreId);
 */
export function validateCentreAccess(
  session: Session | null,
  resourceCentreId: string
): void {
  if (!session?.user?.centreId) {
    throw new Error("UNAUTHORIZED");
  }

  // SUPER_ADMIN can access any centre
  if (session.user.role === "SUPER_ADMIN") {
    return;
  }

  // Everyone else must match centres
  if (session.user.centerId !== resourceCentreId) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Check if user can access a resource from another centre
 * 
 * @param session - User session
 * @param resourceCentreId - The centreId of the resource
 * @returns true if access allowed, false otherwise
 */
export function canAccessCentre(
  session: Session | null,
  resourceCentreId: string
): boolean {
  if (!session?.user?.centreId) {
    return false;
  }

  // SUPER_ADMIN can access any centre
  if (session.user.role === "SUPER_ADMIN") {
    return true;
  }

  // Everyone else must match centres
  return session.user.centerId === resourceCentreId;
}

/**
 * Build a Prisma where clause with centreId filter
 * 
 * @param session - User session
 * @param additionalWhere - Additional where conditions
 * @param requestedCentreId - Optional centreId (SUPER_ADMIN only)
 * @returns Combined where clause
 * 
 * @example
 * const tickets = await prisma.ticket.findMany({
 *   where: buildCentreWhereClause(session, { status: "OPEN" })
 * });
 */
export function buildCentreWhereClause<T extends Record<string, any>>(
  session: Session | null,
  additionalWhere?: T,
  requestedCentreId?: string
): T & { centreId: string } {
  const centreId = getCentreIdForQuery(session, requestedCentreId);

  return {
    ...additionalWhere,
    centreId,
  } as T & { centreId: string };
}

/**
 * Extract centreId from authenticated session
 * 
 * @param session - User session
 * @returns centreId
 * @throws Error if no session or centreId
 */
export function getCentreIdFromSession(session: Session | null): string {
  if (!session?.user?.centreId) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.centerId;
}

/**
 * Validate that centreId is NOT being provided in request body
 * 
 * This is a security check to prevent centreId injection attacks.
 * centreId should ONLY come from session, never from user input.
 * 
 * @param body - Request body
 * @throws Error if centreId found in body
 * 
 * @example
 * const body = await request.json();
 * preventCentreIdInjection(body);
 */
export function preventCentreIdInjection(body: any): void {
  if (body && typeof body === "object" && "centreId" in body) {
    throw new Error(
      "SECURITY_VIOLATION: centreId cannot be provided in request body"
    );
  }
}
