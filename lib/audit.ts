/**
 * Audit Logging Helper
 * 
 * Provides utilities to log privileged actions for compliance and troubleshooting.
 * Every privileged mutation should create an audit event.
 */

import { prisma } from "@/lib/prisma";
import { AuditAction, Role } from "@prisma/client";

interface CreateAuditLogParams {
  userId: string;
  userName: string;
  userRole: Role;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  beforeState?: any;
  afterState?: any;
  centreId: string;
  ipAddress?: string;
  metadata?: any;
}

/**
 * Create an audit log entry
 * 
 * @example
 * await createAuditLog({
 *   userId: session.user.id,
 *   userName: session.user.name,
 *   userRole: session.user.role as Role,
 *   action: "UPDATE",
 *   resourceType: "Refund",
 *   resourceId: refund.id,
 *   beforeState: { status: "PENDING" },
 *   afterState: { status: "APPROVED" },
 *   centreId: session.user.centreId,
 *   ipAddress: request.headers.get("x-forwarded-for") || undefined
 * });
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    // Remove sensitive data from states
    const sanitizedBefore = params.beforeState ? sanitizeState(params.beforeState) : null;
    const sanitizedAfter = params.afterState ? sanitizeState(params.afterState) : null;

    const auditEvent = await prisma.auditEvent.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        beforeState: sanitizedBefore,
        afterState: sanitizedAfter,
        centreId: params.centreId,
        ipAddress: params.ipAddress,
        metadata: params.metadata,
      },
    });

    return auditEvent;
  } catch (error) {
    // Log to console but don't fail the operation
    console.error("Failed to create audit log:", error);
    // In production, send to monitoring service (Sentry, DataDog, etc.)
    return null;
  }
}

/**
 * Sanitize state to remove sensitive information
 */
function sanitizeState(state: any): any {
  if (!state || typeof state !== "object") {
    return state;
  }

  const sensitiveFields = [
    "password",
    "passwordHash",
    "token",
    "secret",
    "apiKey",
    "privateKey",
  ];

  const sanitized = { ...state };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeState(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Helper to create audit log for CREATE operations
 */
export async function auditCreate(
  userId: string,
  userName: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  afterState: any,
  centreId: string,
  ipAddress?: string
) {
  return createAuditLog({
    userId,
    userName,
    userRole,
    action: "CREATE",
    resourceType,
    resourceId,
    afterState,
    centreId,
    ipAddress,
  });
}

/**
 * Helper to create audit log for UPDATE operations
 */
export async function auditUpdate(
  userId: string,
  userName: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  beforeState: any,
  afterState: any,
  centreId: string,
  ipAddress?: string
) {
  return createAuditLog({
    userId,
    userName,
    userRole,
    action: "UPDATE",
    resourceType,
    resourceId,
    beforeState,
    afterState,
    centreId,
    ipAddress,
  });
}

/**
 * Helper to create audit log for DELETE operations
 */
export async function auditDelete(
  userId: string,
  userName: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  beforeState: any,
  centreId: string,
  ipAddress?: string
) {
  return createAuditLog({
    userId,
    userName,
    userRole,
    action: "DELETE",
    resourceType,
    resourceId,
    beforeState,
    centreId,
    ipAddress,
  });
}

/**
 * Helper to create audit log for APPROVE operations
 */
export async function auditApprove(
  userId: string,
  userName: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  beforeState: any,
  afterState: any,
  centreId: string,
  ipAddress?: string
) {
  return createAuditLog({
    userId,
    userName,
    userRole,
    action: "APPROVE",
    resourceType,
    resourceId,
    beforeState,
    afterState,
    centreId,
    ipAddress,
  });
}

/**
 * Helper to create audit log for REJECT operations
 */
export async function auditReject(
  userId: string,
  userName: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  beforeState: any,
  afterState: any,
  centreId: string,
  ipAddress?: string
) {
  return createAuditLog({
    userId,
    userName,
    userRole,
    action: "REJECT",
    resourceType,
    resourceId,
    beforeState,
    afterState,
    centreId,
    ipAddress,
  });
}

/**
 * Helper to create audit log for ESCALATE operations
 */
export async function auditEscalate(
  userId: string,
  userName: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  beforeState: any,
  afterState: any,
  centreId: string,
  ipAddress?: string
) {
  return createAuditLog({
    userId,
    userName,
    userRole,
    action: "ESCALATE",
    resourceType,
    resourceId,
    beforeState,
    afterState,
    centreId,
    ipAddress,
  });
}
