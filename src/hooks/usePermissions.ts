'use client';

import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, canAccessUserData, canCreateUserWithRole, canManageUser } from '@/lib/rbac';

export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, resource, action);
  };

  const checkRole = (requiredRole: 'USER' | 'ADMIN' | 'SUPERUSER'): boolean => {
    if (!user) return false;
    const roleHierarchy = { USER: 1, ADMIN: 2, SUPERUSER: 3 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const canViewUserData = (targetRole: 'USER' | 'ADMIN' | 'SUPERUSER'): boolean => {
    if (!user) return false;
    return canAccessUserData(user.role, targetRole);
  };

  const canCreateUser = (targetRole: 'USER' | 'ADMIN' | 'SUPERUSER'): boolean => {
    if (!user) return false;
    return canCreateUserWithRole(user.role, targetRole);
  };

  const canManageUserAccount = (targetRole: 'USER' | 'ADMIN' | 'SUPERUSER'): boolean => {
    if (!user) return false;
    return canManageUser(user.role, targetRole);
  };

  return {
    user,
    checkPermission,
    checkRole,
    canViewUserData,
    canCreateUser,
    canManageUserAccount,
    isUser: user?.role === 'USER',
    isAdmin: user?.role === 'ADMIN',
    isSuperUser: user?.role === 'SUPERUSER',
    isAdminOrHigher: checkRole('ADMIN'),
    isSuperUserOnly: user?.role === 'SUPERUSER',
  };
}
