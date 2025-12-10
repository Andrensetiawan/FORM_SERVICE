import { ROLES, UserRole as RoleType } from "@/lib/roles";

// Array of all valid roles
export const VALID_ROLES = Object.values(ROLES);

// Array of roles that require approval
export const ROLES_REQUIRING_APPROVAL = [
  ROLES.STAFF,
  ROLES.MANAGER,
  ROLES.OWNER,
] as const;

// Array of roles that can manage staff
export const ROLES_CAN_MANAGE_STAFF = [
  ROLES.ADMIN,
  ROLES.OWNER,
  ROLES.MANAGER,
] as const;

// Array of roles that can manage system
export const ROLES_CAN_MANAGE_SYSTEM = [
  ROLES.ADMIN,
  ROLES.OWNER,
  ROLES.MANAGER,
] as const;

// 🔒 TYPE SAH
export type { RoleType };

/**
 * Validate role
 */
export const isValidRole = (role: unknown): role is RoleType => {
  return typeof role === "string" && VALID_ROLES.includes(role as RoleType);
};

/**
 * Role needs approval
 */
export const isRoleRequiringApproval = (role: unknown): boolean => {
  if (!role || typeof role !== "string") return false;
  return ROLES_REQUIRING_APPROVAL.includes(role as any);
};

export const canManageStaff = (role: unknown): boolean => {
  if (!role || typeof role !== "string") return false;
  return ROLES_CAN_MANAGE_STAFF.includes(role as any);
};

export const canManageSystem = (role: unknown): boolean => {
  if (!role || typeof role !== "string") return false;
  return ROLES_CAN_MANAGE_SYSTEM.includes(role as any);
};
