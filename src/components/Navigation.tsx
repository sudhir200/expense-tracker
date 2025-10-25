'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Settings, 
  Menu, 
  X,
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Users,
  Shield,
  TrendingUp,
  Home,
  Tag,
  Search
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

// Base navigation items available to all users
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['USER', 'ADMIN', 'SUPERUSER'] },
  { name: 'My Families', href: '/families', icon: Users, roles: ['USER', 'ADMIN', 'SUPERUSER'] },
  { name: 'Family Dashboard', href: '/family', icon: Home, roles: ['USER', 'ADMIN', 'SUPERUSER'] },
  { name: 'Expenses', href: '/expenses', icon: Receipt, roles: ['USER', 'ADMIN', 'SUPERUSER'] },
  { name: 'Income', href: '/income', icon: TrendingUp, roles: ['USER', 'ADMIN', 'SUPERUSER'] },
  { name: 'Categories', href: '/categories', icon: Tag, roles: ['USER', 'ADMIN', 'SUPERUSER'] },
  { name: 'Analytics', href: '/analytics', icon: PieChart, roles: ['USER', 'ADMIN', 'SUPERUSER'] },
];

// Admin navigation items
const adminNavigation = [
  { name: 'User Management', href: '/admin/users', icon: Users, roles: ['ADMIN', 'SUPERUSER'] },
  { name: 'System Analytics', href: '/admin/analytics', icon: Shield, roles: ['ADMIN', 'SUPERUSER'] },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme, isDark } = useSettings();
  const { user, logout, isAuthenticated } = useAuth();
  const { isAdminOrHigher,isSuperUserOnly } = usePermissions();
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && !(event.target as Element).closest('.dropdown-container')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Filter navigation items based on user role
  const getFilteredNavigation = () => {
    const allNavigation = [...baseNavigation];
    
    // Add admin navigation for ADMIN and SUPERUSER
    if (isAdminOrHigher) {
      allNavigation.push(...adminNavigation);
    }
    
    return allNavigation.filter(item => 
      user && item.roles.includes(user.role)
    );
  };

  const navigation = getFilteredNavigation();

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const setSystemTheme = () => {
    setTheme('system');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Don't show navigation if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 relative">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Left side - Logo + Main Navigation */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2 group flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              <span className="hidden md:block text-lg font-bold text-gray-900 dark:text-white">
                ExpenseTracker
              </span>
            </Link>

            {/* Main Navigation - moved to left */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.slice(0, 4).map((item) => { // Show first 4 main items
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2 relative">
            {/* User info - simplified */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
            >
            <div className="flex items-center space-x-3 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user?.role === 'SUPERUSER'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      : user?.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              }`}>
                {user?.role}
              </span>
            </div>
            </button>
            
            {/* Settings/Navigation Dropdown */}
            {mobileMenuOpen && (
              <div className="dropdown-container absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[60]">
                <div className="p-4 space-y-4">
                  {/* Navigation items (mobile only) */}
                  <div className="lg:hidden space-y-1">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                      Navigation
                    </div>
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                            isActive
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
            
            {/* Theme settings */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                Theme
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => {
                    setSystemTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2"
                  size="sm"
                >
                  <Monitor className="h-4 w-4" />
                  <span>System</span>
                </Button>
                <Button
                  variant={theme !== 'system' ? 'default' : 'outline'}
                  onClick={() => {
                    toggleDarkMode();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2"
                  size="sm"
                >
                  {isDark ? (
                    <>
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
              <Link
                href="/settings?tab=profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-start w-full space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-start w-full space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-start w-full space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
                <span>Documentation</span>
              </Link>

              {/* Command Palette - SUPERUSER only */}
              {isSuperUserOnly && (
                <div className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4" />
                      <span className="text-sm">Quick Navigation</span>
                    </div>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono">
                      {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+/
                    </kbd>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Access all routes instantly
                  </div>
                </div>
              )}
              
              {/* Admin Options - Only for ADMIN and SUPERUSER */}
              {isAdminOrHigher && (
                <>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 pt-2 pb-1">
                    {user?.role === 'SUPERUSER' ? 'Super Admin' : 'Admin'}
                  </div>
                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-start w-full space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                  </Link>
                  <Link
                    href="/admin/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-start w-full space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>System Analytics</span>
                  </Link>
                </>
              )}
              
              <Button
                variant="ghost"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-start w-full space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
