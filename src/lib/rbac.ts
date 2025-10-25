// Role-Based Access Control (RBAC) utilities

export type UserRole = 'USER' | 'ADMIN' | 'SUPERUSER';

export interface Permission {
  resource: string;
  action: string;
}

// Define role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  ADMIN: 2,
  SUPERUSER: 3,
};

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    // Own data management
    { resource: 'expense', action: 'create' },
    { resource: 'expense', action: 'read_own' },
    { resource: 'expense', action: 'update_own' },
    { resource: 'expense', action: 'delete_own' },
    // Income permissions - users can manage their own income
    { resource: 'income', action: 'create' },
    { resource: 'income', action: 'read_own' },
    { resource: 'income', action: 'update_own' },
    { resource: 'income', action: 'delete_own' },
    { resource: 'category', action: 'create' },
    { resource: 'category', action: 'read_own' },
    { resource: 'category', action: 'update_own' },
    { resource: 'category', action: 'delete_own' },
    { resource: 'budget', action: 'create' },
    { resource: 'budget', action: 'read_own' },
    { resource: 'budget', action: 'update_own' },
    { resource: 'budget', action: 'delete_own' },
    { resource: 'exchangerate', action: 'create' },
    { resource: 'exchangerate', action: 'read_own' },
    { resource: 'exchangerate', action: 'update_own' },
    { resource: 'exchangerate', action: 'delete_own' },
    { resource: 'analytics', action: 'read_own' },
    { resource: 'profile', action: 'read_own' },
    { resource: 'profile', action: 'update_own' },
  ],
  ADMIN: [
    // User management
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'read_all' },
    { resource: 'user', action: 'update_all' },
    { resource: 'user', action: 'deactivate' },
    // Income management for admins
    { resource: 'income', action: 'create' },
    { resource: 'income', action: 'read_all' },
    { resource: 'income', action: 'update_all' },
    { resource: 'income', action: 'delete_all' },
    // View user data (read-only)
    { resource: 'expense', action: 'read_all' },
    { resource: 'analytics', action: 'read_all' },
    // System management
    { resource: 'reports', action: 'generate' },
    { resource: 'export', action: 'all_users' },
  ],
  SUPERUSER: [
    // Full system access
    { resource: 'user', action: 'delete' },
    { resource: 'user', action: 'promote_admin' },
    { resource: 'user', action: 'demote_admin' },
    // Full data access
    { resource: 'expense', action: 'update_all' },
    { resource: 'expense', action: 'delete_all' },
    { resource: 'income', action: 'create' },
    { resource: 'income', action: 'read_all' },
    { resource: 'income', action: 'update_all' },
    { resource: 'income', action: 'delete_all' },
    // System administration
    { resource: 'system', action: 'backup' },
    { resource: 'system', action: 'restore' },
    { resource: 'system', action: 'configure' },
    { resource: 'audit', action: 'read_all' },
  ],
};

// Check if a role has a specific permission
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  // Get all permissions for the user's role and higher roles
  const userRoleLevel = ROLE_HIERARCHY[userRole];
  
  for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
    if (level <= userRoleLevel) {
      const permissions = ROLE_PERMISSIONS[role as UserRole];
      const hasPermission = permissions.some(
        p => p.resource === resource && p.action === action
      );
      if (hasPermission) {
        return true;
      }
    }
  }
  
  return false;
}

// Check if a role can access another role's data
export function canAccessUserData(accessorRole: UserRole, targetRole: UserRole): boolean {
  const accessorLevel = ROLE_HIERARCHY[accessorRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  // SUPERUSER can access all data
  if (accessorRole === 'SUPERUSER') return true;
  
  // ADMIN can access USER data but not other ADMIN or SUPERUSER data
  if (accessorRole === 'ADMIN' && targetRole === 'USER') return true;
  
  // Users can only access their own data
  return accessorLevel >= targetLevel;
}

// Check if a role can create users with a specific role
export function canCreateUserWithRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  // SUPERUSER can create ADMIN and USER accounts
  if (creatorRole === 'SUPERUSER' && (targetRole === 'ADMIN' || targetRole === 'USER')) {
    return true;
  }
  
  // ADMIN can create USER accounts
  if (creatorRole === 'ADMIN' && targetRole === 'USER') {
    return true;
  }
  
  return false;
}

// Get allowed roles that a user can create
export function getAllowedRolesToCreate(creatorRole: UserRole): UserRole[] {
  switch (creatorRole) {
    case 'SUPERUSER':
      return ['ADMIN', 'USER'];
    case 'ADMIN':
      return ['USER'];
    case 'USER':
      return [];
    default:
      return [];
  }
}

// Check if a role can manage (edit/deactivate) another user
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  const managerLevel = ROLE_HIERARCHY[managerRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  // Can only manage users of lower or equal role level
  // But SUPERUSER can manage ADMIN, ADMIN can manage USER
  if (managerRole === 'SUPERUSER' && targetRole !== 'SUPERUSER') return true;
  if (managerRole === 'ADMIN' && targetRole === 'USER') return true;
  
  return false;
}

// Middleware function to check permissions
export function requirePermission(resource: string, action: string) {
  return (userRole: UserRole) => {
    if (!hasPermission(userRole, resource, action)) {
      throw new Error(`Access denied. Required permission: ${resource}:${action}`);
    }
    return true;
  };
}

// Middleware function to check role level
export function requireRole(requiredRole: UserRole) {
  return (userRole: UserRole) => {
    const userLevel = ROLE_HIERARCHY[userRole];
    const requiredLevel = ROLE_HIERARCHY[requiredRole];
    
    if (userLevel < requiredLevel) {
      throw new Error(`Access denied. Required role: ${requiredRole} or higher`);
    }
    return true;
  };
}
