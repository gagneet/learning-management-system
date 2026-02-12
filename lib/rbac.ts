/**
 * Role-Based Access Control (RBAC) Helper
 * 
 * Provides utilities to check user permissions based on their role.
 * All API endpoints should use these helpers to enforce authorization.
 */

import { Role } from "@prisma/client";

interface Session {
  user: {
    id: string;
    role: string;
    centerId: string;  // Match NextAuth session spelling
    [key: string]: any;
  };
}

/**
 * Permission definitions for different actions
 * Format: "domain:resource:action"
 */
export const Permissions = {
  // Governance
  AUDIT_VIEW: "governance:audit:view",
  APPROVAL_VIEW: "governance:approval:view",
  APPROVAL_APPROVE: "governance:approval:approve",
  APPROVAL_REJECT: "governance:approval:reject",

  // Academic - Classes
  CLASS_CREATE: "academic:class:create",
  CLASS_VIEW_ALL: "academic:class:view_all",
  CLASS_VIEW_OWN: "academic:class:view_own",
  CLASS_UPDATE: "academic:class:update",
  CLASS_DELETE: "academic:class:delete",
  CLASS_MANAGE_MEMBERS: "academic:class:manage_members",

  // Academic - Sessions
  SESSION_CREATE: "academic:session:create",
  SESSION_CANCEL: "academic:session:cancel",
  SESSION_VIEW: "academic:session:view",
  SESSION_MANAGE_STUDENTS: "academic:session:manage_students", // NEW: Manage student enrollments

  // Academic - Attendance
  ATTENDANCE_MARK: "academic:attendance:mark",
  ATTENDANCE_VIEW_ALL: "academic:attendance:view_all",
  ATTENDANCE_VIEW_OWN: "academic:attendance:view_own",
  
  // Academic - Assessment (NEW)
  ASSESSMENT_VIEW: "academic:assessment:view", // View student assessments
  ASSESSMENT_SUBMIT: "academic:assessment:submit", // Submit assessments for students
  ASSESSMENT_GRADE: "academic:assessment:grade", // Grade assessments

  // Academic - Catch-Ups
  CATCHUP_VIEW_ALL: "academic:catchup:view_all",
  CATCHUP_VIEW_OWN: "academic:catchup:view_own",
  CATCHUP_UPDATE: "academic:catchup:update",

  // Operations - Tickets
  TICKET_CREATE: "operations:ticket:create",
  TICKET_VIEW_ALL: "operations:ticket:view_all",
  TICKET_VIEW_OWN: "operations:ticket:view_own",
  TICKET_ASSIGN: "operations:ticket:assign",
  TICKET_UPDATE: "operations:ticket:update",
  TICKET_CLOSE: "operations:ticket:close",

  // Finance
  FINANCE_FEE_PLAN_CREATE: "finance:fee_plan:create",
  FINANCE_FEE_PLAN_VIEW: "finance:fee_plan:view",
  FINANCE_INVOICE_CREATE: "finance:invoice:create",
  FINANCE_INVOICE_VIEW_ALL: "finance:invoice:view_all",
  FINANCE_INVOICE_VIEW_OWN: "finance:invoice:view_own",
  FINANCE_PAYMENT_CREATE: "finance:payment:create",
  FINANCE_PAYMENT_VIEW: "finance:payment:view",
  FINANCE_REFUND_REQUEST: "finance:refund:request",
  FINANCE_REFUND_APPROVE: "finance:refund:approve",
  FINANCE_REFUND_VIEW: "finance:refund:view",
} as const;

/**
 * Role permission matrix
 * Defines which roles have which permissions
 */
const RolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: Object.values(Permissions), // All permissions

  CENTER_ADMIN: [
    // Governance
    Permissions.AUDIT_VIEW,
    Permissions.APPROVAL_VIEW,
    Permissions.APPROVAL_APPROVE,
    Permissions.APPROVAL_REJECT,
    // Academic
    Permissions.CLASS_CREATE,
    Permissions.CLASS_VIEW_ALL,
    Permissions.CLASS_UPDATE,
    Permissions.CLASS_DELETE,
    Permissions.CLASS_MANAGE_MEMBERS,
    Permissions.SESSION_CREATE,
    Permissions.SESSION_CANCEL,
    Permissions.SESSION_VIEW,
    Permissions.ATTENDANCE_MARK,
    Permissions.ATTENDANCE_VIEW_ALL,
    Permissions.CATCHUP_VIEW_ALL,
    // Operations
    Permissions.TICKET_CREATE,
    Permissions.TICKET_VIEW_ALL,
    Permissions.TICKET_ASSIGN,
    Permissions.TICKET_UPDATE,
    Permissions.TICKET_CLOSE,
    // Finance
    Permissions.FINANCE_FEE_PLAN_CREATE,
    Permissions.FINANCE_FEE_PLAN_VIEW,
    Permissions.FINANCE_INVOICE_CREATE,
    Permissions.FINANCE_INVOICE_VIEW_ALL,
    Permissions.FINANCE_PAYMENT_CREATE,
    Permissions.FINANCE_PAYMENT_VIEW,
    Permissions.FINANCE_REFUND_REQUEST,
    Permissions.FINANCE_REFUND_VIEW,
  ],

  CENTER_SUPERVISOR: [
    // Governance
    Permissions.AUDIT_VIEW,
    Permissions.APPROVAL_VIEW,
    Permissions.APPROVAL_APPROVE,
    // Academic - Enhanced with tutor and assessor capabilities
    Permissions.CLASS_CREATE, // NEW: Can create classes as tutor
    Permissions.CLASS_VIEW_ALL,
    Permissions.CLASS_UPDATE, // NEW: Can update classes
    Permissions.CLASS_MANAGE_MEMBERS, // NEW: Can manage class members
    Permissions.SESSION_CREATE, // NEW: Can create sessions as tutor
    Permissions.SESSION_CANCEL, // NEW: Can cancel sessions
    Permissions.SESSION_VIEW,
    Permissions.SESSION_MANAGE_STUDENTS, // NEW: Can manage student session enrollments
    Permissions.ATTENDANCE_MARK, // NEW: Can mark attendance as tutor
    Permissions.ATTENDANCE_VIEW_ALL,
    Permissions.ASSESSMENT_VIEW, // NEW: Can view all assessments
    Permissions.ASSESSMENT_SUBMIT, // NEW: Can submit assessments for students
    Permissions.ASSESSMENT_GRADE, // NEW: Can grade assessments
    Permissions.CATCHUP_VIEW_ALL,
    Permissions.CATCHUP_UPDATE, // NEW: Can update catch-up packages
    // Operations
    Permissions.TICKET_CREATE,
    Permissions.TICKET_VIEW_ALL,
    Permissions.TICKET_ASSIGN,
    Permissions.TICKET_UPDATE,
    Permissions.TICKET_CLOSE,
  ],

  FINANCE_ADMIN: [
    // Governance
    Permissions.AUDIT_VIEW,
    Permissions.APPROVAL_VIEW,
    Permissions.APPROVAL_APPROVE, // For finance-related approvals
    // Finance
    Permissions.FINANCE_FEE_PLAN_CREATE,
    Permissions.FINANCE_FEE_PLAN_VIEW,
    Permissions.FINANCE_INVOICE_CREATE,
    Permissions.FINANCE_INVOICE_VIEW_ALL,
    Permissions.FINANCE_PAYMENT_CREATE,
    Permissions.FINANCE_PAYMENT_VIEW,
    Permissions.FINANCE_REFUND_REQUEST,
    Permissions.FINANCE_REFUND_APPROVE,
    Permissions.FINANCE_REFUND_VIEW,
    // Operations
    Permissions.TICKET_CREATE,
    Permissions.TICKET_VIEW_OWN,
  ],

  TEACHER: [
    // Academic
    Permissions.CLASS_CREATE,
    Permissions.CLASS_VIEW_OWN,
    Permissions.CLASS_UPDATE, // Own classes only
    Permissions.SESSION_CREATE, // Own classes only
    Permissions.SESSION_CANCEL, // Own sessions only
    Permissions.SESSION_VIEW,
    Permissions.SESSION_MANAGE_STUDENTS, // NEW: Manage student enrollments in own sessions
    Permissions.ATTENDANCE_MARK, // Own sessions only
    Permissions.ATTENDANCE_VIEW_OWN,
    Permissions.ASSESSMENT_VIEW, // NEW: View assessments for own students
    Permissions.ASSESSMENT_SUBMIT, // NEW: Submit assessments for own students
    Permissions.ASSESSMENT_GRADE, // NEW: Grade own students' assessments
    Permissions.CATCHUP_VIEW_OWN, // Own students only
    // Operations
    Permissions.TICKET_CREATE,
    Permissions.TICKET_VIEW_OWN,
  ],

  PARENT: [
    // Academic - View children's data only
    Permissions.CLASS_VIEW_OWN, // Children's classes
    Permissions.ATTENDANCE_VIEW_OWN, // Children's attendance
    Permissions.CATCHUP_VIEW_OWN, // Children's catch-ups
    // Finance - View children's invoices
    Permissions.FINANCE_INVOICE_VIEW_OWN,
    // Operations
    Permissions.TICKET_CREATE,
    Permissions.TICKET_VIEW_OWN,
  ],

  STUDENT: [
    // Academic - View own data only
    Permissions.CLASS_VIEW_OWN,
    Permissions.ATTENDANCE_VIEW_OWN,
    Permissions.CATCHUP_VIEW_OWN,
    Permissions.CATCHUP_UPDATE, // Update own catch-up status
    // Finance - View own invoices
    Permissions.FINANCE_INVOICE_VIEW_OWN,
    // Operations
    Permissions.TICKET_CREATE,
    Permissions.TICKET_VIEW_OWN,
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(session: Session | null, permission: string): boolean {
  if (!session?.user?.role) {
    return false;
  }

  const role = session.user.role as Role;
  const permissions = RolePermissions[role];

  return permissions?.includes(permission) || false;
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(session: Session | null, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(session, permission));
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(session: Session | null, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(session, permission));
}

/**
 * Check if a user has a specific role
 */
export function hasRole(session: Session | null, role: Role): boolean {
  return session?.user?.role === role;
}

/**
 * Check if a user has ANY of the specified roles
 */
export function hasAnyRole(session: Session | null, roles: Role[]): boolean {
  if (!session?.user?.role) {
    return false;
  }
  return roles.includes(session.user.role as Role);
}

/**
 * Require permission - throw error if not authorized
 */
export function requirePermission(session: Session | null, permission: string) {
  if (!hasPermission(session, permission)) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Require role - throw error if not authorized
 */
export function requireRole(session: Session | null, role: Role) {
  if (!hasRole(session, role)) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Require any role - throw error if not authorized
 */
export function requireAnyRole(session: Session | null, roles: Role[]) {
  if (!hasAnyRole(session, roles)) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Helper to determine if user is admin (can manage centre)
 */
export function isAdmin(session: Session | null): boolean {
  return hasAnyRole(session, ["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR"]);
}

/**
 * Helper to determine if user can access cross-centre data
 */
export function canAccessCrossCenter(session: Session | null): boolean {
  return hasRole(session, "SUPER_ADMIN");
}
