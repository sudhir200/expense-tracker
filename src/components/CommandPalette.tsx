'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Search,
  X,
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Tag,
  PieChart,
  Users,
  Home,
  Settings,
  User,
  Shield,
  Globe,
  Bell,
  Palette,
  Download,
  Key,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Route {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  category: string;
  description: string;
  roles: string[];
  keywords: string[];
}

const allRoutes: Route[] = [
  // Main Navigation
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    category: 'Main',
    description: 'Overview of your expenses and income',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['dashboard', 'overview', 'home', 'main']
  },
  {
    id: 'families',
    name: 'My Families',
    path: '/families',
    icon: Users,
    category: 'Main',
    description: 'Manage your family memberships',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['families', 'family', 'members', 'household']
  },
  {
    id: 'family-dashboard',
    name: 'Family Dashboard',
    path: '/family',
    icon: Home,
    category: 'Main',
    description: 'Current family budget overview',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['family', 'budget', 'household', 'shared']
  },
  {
    id: 'expenses',
    name: 'Expenses',
    path: '/expenses',
    icon: Receipt,
    category: 'Main',
    description: 'Track and manage your expenses',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['expenses', 'spending', 'costs', 'bills']
  },
  {
    id: 'income',
    name: 'Income',
    path: '/income',
    icon: TrendingUp,
    category: 'Main',
    description: 'Manage your income sources',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['income', 'salary', 'earnings', 'revenue']
  },
  {
    id: 'categories',
    name: 'Categories',
    path: '/categories',
    icon: Tag,
    category: 'Main',
    description: 'Organize expenses and income by categories',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['categories', 'tags', 'organize', 'classification']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    path: '/analytics',
    icon: PieChart,
    category: 'Main',
    description: 'Analyze your spending patterns',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['analytics', 'reports', 'charts', 'analysis']
  },

  // Settings
  {
    id: 'settings',
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    category: 'Settings',
    description: 'Application settings and preferences',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['settings', 'preferences', 'configuration']
  },
  {
    id: 'profile',
    name: 'Profile',
    path: '/settings?tab=profile',
    icon: User,
    category: 'Settings',
    description: 'Manage your profile information',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['profile', 'account', 'personal', 'user']
  },
  {
    id: 'preferences',
    name: 'Preferences',
    path: '/settings?tab=preferences',
    icon: Globe,
    category: 'Settings',
    description: 'Application preferences and defaults',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['preferences', 'defaults', 'options']
  },
  {
    id: 'security',
    name: 'Security',
    path: '/settings?tab=security',
    icon: Key,
    category: 'Settings',
    description: 'Password and security settings',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['security', 'password', 'authentication', 'safety']
  },
  {
    id: 'notifications',
    name: 'Notifications',
    path: '/settings?tab=notifications',
    icon: Bell,
    category: 'Settings',
    description: 'Notification preferences',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['notifications', 'alerts', 'emails', 'reminders']
  },
  {
    id: 'appearance',
    name: 'Appearance',
    path: '/settings?tab=appearance',
    icon: Palette,
    category: 'Settings',
    description: 'Theme and display settings',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['appearance', 'theme', 'dark', 'light', 'display']
  },
  {
    id: 'data-export',
    name: 'Data & Export',
    path: '/settings?tab=data',
    icon: Download,
    category: 'Settings',
    description: 'Data management and export options',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['data', 'export', 'backup', 'download']
  },
  {
    id: 'currency',
    name: 'Currency Settings',
    path: '/settings/currency',
    icon: DollarSign,
    category: 'Settings',
    description: 'Currency and exchange rate settings',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['currency', 'exchange', 'rates', 'money']
  },
  {
    id: 'documentation',
    name: 'Documentation',
    path: '/docs',
    icon: Search,
    category: 'Settings',
    description: 'Complete user and developer documentation',
    roles: ['USER', 'ADMIN', 'SUPERUSER'],
    keywords: ['docs', 'documentation', 'help', 'guide', 'manual']
  },

  // Admin Routes
  {
    id: 'admin-users',
    name: 'User Management',
    path: '/admin/users',
    icon: Users,
    category: 'Admin',
    description: 'Manage user accounts and permissions',
    roles: ['ADMIN', 'SUPERUSER'],
    keywords: ['users', 'accounts', 'permissions', 'management']
  },
  {
    id: 'admin-analytics',
    name: 'System Analytics',
    path: '/admin/analytics',
    icon: Shield,
    category: 'Admin',
    description: 'System-wide analytics and performance',
    roles: ['ADMIN', 'SUPERUSER'],
    keywords: ['system', 'analytics', 'performance', 'admin']
  }
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const { isSuperUserOnly } = usePermissions();

  // Filter routes based on user role and search query
  const filteredRoutes = useMemo(() => {
    if (!user) return [];

    let routes = allRoutes.filter(route => route.roles.includes(user.role));
    
    // For non-superusers, limit to their accessible routes
    if (!isSuperUserOnly) {
      routes = routes.filter(route => 
        route.category !== 'Admin' || route.roles.includes(user.role)
      );
    }

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      routes = routes.filter(route => 
        route.name.toLowerCase().includes(searchTerm) ||
        route.description.toLowerCase().includes(searchTerm) ||
        route.keywords.some(keyword => keyword.includes(searchTerm)) ||
        route.category.toLowerCase().includes(searchTerm)
      );
    }

    return routes;
  }, [user, query, isSuperUserOnly]);

  // Reset selection when filtered routes change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredRoutes]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredRoutes.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredRoutes.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredRoutes[selectedIndex]) {
            handleRouteSelect(filteredRoutes[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredRoutes, onClose]);

  const handleRouteSelect = (route: Route) => {
    router.push(route.path);
    onClose();
    setQuery('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Main': return LayoutDashboard;
      case 'Settings': return Settings;
      case 'Admin': return Shield;
      default: return LayoutDashboard;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Main': return 'text-blue-600 dark:text-blue-400';
      case 'Settings': return 'text-green-600 dark:text-green-400';
      case 'Admin': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search routes and pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredRoutes.length > 0 ? (
            <div className="py-2">
              {/* Group by category */}
              {['Main', 'Settings', 'Admin'].map(category => {
                const categoryRoutes = filteredRoutes.filter(route => route.category === category);
                if (categoryRoutes.length === 0) return null;

                const CategoryIcon = getCategoryIcon(category);
                
                return (
                  <div key={category} className="mb-2">
                    {/* Category Header */}
                    <div className="flex items-center px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <CategoryIcon className={cn('h-3 w-3 mr-2', getCategoryColor(category))} />
                      {category}
                    </div>
                    
                    {/* Category Routes */}
                    {categoryRoutes.map((route, index) => {
                      const globalIndex = filteredRoutes.indexOf(route);
                      const Icon = route.icon;
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={route.id}
                          onClick={() => handleRouteSelect(route)}
                          className={cn(
                            'w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                            isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600'
                          )}
                        >
                          <Icon className={cn(
                            'h-5 w-5 mr-3',
                            isSelected 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          )} />
                          <div className="flex-1">
                            <div className={cn(
                              'font-medium',
                              isSelected 
                                ? 'text-blue-900 dark:text-blue-100' 
                                : 'text-gray-900 dark:text-white'
                            )}>
                              {route.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {route.description}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              ↵
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 dark:text-gray-400">
                {query ? 'No routes found' : 'Start typing to search routes...'}
              </div>
              {query && (
                <div className="text-sm text-gray-400 mt-1">
                  Try searching for "dashboard", "settings", or "admin"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs">↑↓</kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs">↵</kbd>
                <span className="ml-1">Select</span>
              </span>
              <span className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs">Esc</kbd>
                <span className="ml-1">Close</span>
              </span>
            </div>
            <div>
              {isSuperUserOnly ? (
                <span className="text-red-600 dark:text-red-400 font-medium">SUPERUSER ACCESS</span>
              ) : (
                <span>{filteredRoutes.length} routes available</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
