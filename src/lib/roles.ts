/**
 * Role constants for the application.
 * Centralized role definitions to prevent typos and ensure consistency.
 */

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  OWNER: "owner",
  STAFF: "staff",
  USER: "user",
} as const;

// Array of all valid roles (for validation, dropdowns, etc.)
export const VALID_ROLES = Object.values(ROLES);

// Array of roles that require admin/owner approval
export const ROLES_REQUIRING_APPROVAL = [ROLES.STAFF, ROLES.MANAGER];

// Array of roles that can manage staff
export const ROLES_CAN_MANAGE_STAFF = [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER];

// Array of roles that can manage system
export const ROLES_CAN_MANAGE_SYSTEM = [ROLES.ADMIN, ROLES.OWNER];

// Type for role validation
export type RoleType = (typeof ROLES)[keyof typeof ROLES];

/**
 * Check if a role is valid
 */
export const isValidRole = (role: unknown): role is RoleType => {
  return typeof role === "string" && VALID_ROLES.includes(role as RoleType);
};

/**
 * Check if a role can manage staff
 */
export const canManageStaff = (role: unknown): boolean => {
  return ROLES_CAN_MANAGE_STAFF.includes(role as any);
};

/**
 * Check if a role can manage system
 */
export const canManageSystem = (role: unknown): boolean => {
  return ROLES_CAN_MANAGE_SYSTEM.includes(role as any);
};
