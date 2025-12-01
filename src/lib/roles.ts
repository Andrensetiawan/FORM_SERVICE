export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
  CUSTOMER: "customer",
  UNKNOWN :"unknown"
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
