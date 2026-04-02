// User roles with hierarchical permissions
export enum Role {
  VIEWER = 'VIEWER',
  ANALYST = 'ANALYST',
  ADMIN = 'ADMIN',
}

// User account status
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// Financial record types
export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// Permission definitions
export const Permissions = {
  // Dashboard
  READ_DASHBOARD: 'read:dashboard',
  READ_ANALYTICS: 'read:analytics',
  
  // Records
  READ_RECORDS: 'read:records',
  CREATE_RECORDS: 'create:records',
  UPDATE_RECORDS: 'update:records',
  DELETE_RECORDS: 'delete:records',
  
  // Users
  READ_USERS: 'read:users',
  CREATE_USERS: 'create:users',
  UPDATE_USERS: 'update:users',
  DELETE_USERS: 'delete:users',
  MANAGE_ROLES: 'manage:roles',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

// Role-Permission mapping
export const RolePermissions: Record<Role, Permission[]> = {
  [Role.VIEWER]: [
    Permissions.READ_DASHBOARD,
    Permissions.READ_RECORDS,
  ],
  [Role.ANALYST]: [
    Permissions.READ_DASHBOARD,
    Permissions.READ_ANALYTICS,
    Permissions.READ_RECORDS,
    Permissions.READ_USERS,
  ],
  [Role.ADMIN]: Object.values(Permissions), // Admin has all permissions
};

// Check if a role has a specific permission
export const hasPermission = (role: Role, permission: Permission): boolean => {
  return RolePermissions[role]?.includes(permission) ?? false;
};

// Role hierarchy (higher index = more privileges)
export const RoleHierarchy: Role[] = [Role.VIEWER, Role.ANALYST, Role.ADMIN];

export const isRoleHigherOrEqual = (userRole: Role, requiredRole: Role): boolean => {
  return RoleHierarchy.indexOf(userRole) >= RoleHierarchy.indexOf(requiredRole);
};
