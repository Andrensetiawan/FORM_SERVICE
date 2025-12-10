export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
  PENDING: "pending",
  CUSTOMER: "customer",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
