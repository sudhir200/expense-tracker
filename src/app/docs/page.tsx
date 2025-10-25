'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Book, 
  Rocket, 
  Settings, 
  Users, 
  Code, 
  HelpCircle,
  ChevronRight,
  ChevronDown,
  FileText,
  Zap,
  Shield,
  BarChart3,
  Search
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
  subsections?: DocSection[];
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const docSections: DocSection[] = [
    {
      id: 'overview',
      title: 'Project Overview',
      icon: Book,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            ExpenseTracker is a comprehensive full-stack expense and income tracking application 
            built with modern web technologies. It supports individual users, family budget 
            management, and administrative oversight with role-based access control.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Multi-user Support</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">Individual and family budget management</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Role-based Access</h4>
              <p className="text-sm text-green-800 dark:text-green-200">USER, ADMIN, and SUPERUSER roles</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Real-time Analytics</h4>
              <p className="text-sm text-purple-800 dark:text-purple-200">Interactive charts and financial insights</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Advanced Features</h4>
              <p className="text-sm text-orange-800 dark:text-orange-200">Bulk operations, data export, refactoring tools</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Features & Capabilities',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Financial Management
            </h4>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Expense tracking with categories and payment methods</li>
              <li>• Income management with allocation and frequency settings</li>
              <li>• Family budget sharing and collaborative tracking</li>
              <li>• Custom categories with emoji support</li>
              <li>• Budget alerts and progress tracking</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Family Features
            </h4>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Create and manage family groups</li>
              <li>• Invite members with role assignments</li>
              <li>• Shared budgets and expense tracking</li>
              <li>• Income allocation between personal and family</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Tools
            </h4>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Bulk operations for multiple records</li>
              <li>• Data refactoring and standardization</li>
              <li>• Command palette for quick navigation (SUPERUSER)</li>
              <li>• Advanced search and filtering</li>
              <li>• Data export in CSV and JSON formats</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Prerequisites</h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Node.js 18+ installed</li>
              <li>• MongoDB database (local or cloud)</li>
              <li>• Package manager (npm, yarn, or pnpm)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Installation Steps</h4>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-2">1. Clone Repository</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  git clone &lt;repository-url&gt; && cd expensetracker
                </code>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-2">2. Install Dependencies</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  npm install
                </code>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-2">3. Environment Setup</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  MONGODB_URI=mongodb://localhost:27017/expensetracker
                </code>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-2">4. Start Development</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  npm run dev
                </code>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'user-guide',
      title: 'User Guide',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dashboard Overview</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              The dashboard provides a comprehensive view of your financial status with:
            </p>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Summary cards showing total income, expenses, and net balance</li>
              <li>• Interactive charts for spending analysis</li>
              <li>• Recent transactions and budget progress</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Managing Expenses</h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Click "Add Expense" to record new expenses</li>
              <li>• Use bulk operations to manage multiple expenses</li>
              <li>• Apply filters to find specific transactions</li>
              <li>• Export data for external analysis</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Family Management</h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Create family groups for shared budgeting</li>
              <li>• Invite members using invitation codes</li>
              <li>• Assign roles (family head, adult, child)</li>
              <li>• Track shared expenses and income</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'admin-guide',
      title: 'Admin Guide',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Admin Roles</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h5 className="font-medium text-green-900 dark:text-green-100">USER</h5>
                <p className="text-sm text-green-800 dark:text-green-200">Basic expense and income tracking</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-medium text-blue-900 dark:text-blue-100">ADMIN</h5>
                <p className="text-sm text-blue-800 dark:text-blue-200">User management and system analytics</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h5 className="font-medium text-red-900 dark:text-red-100">SUPERUSER</h5>
                <p className="text-sm text-red-800 dark:text-red-200">Full system access and advanced tools</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">User Management</h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Access via Admin → User Management</li>
              <li>• View all registered users and their roles</li>
              <li>• Promote/demote user roles as needed</li>
              <li>• Monitor user activity and statistics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">System Analytics</h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• System-wide financial overview</li>
              <li>• User registration and activity metrics</li>
              <li>• Performance monitoring and health checks</li>
              <li>• Usage patterns and feature adoption</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'api-docs',
      title: 'API Documentation',
      icon: Code,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Authentication Endpoints</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-green-600 dark:text-green-400">POST</span> /api/auth/login - User login
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-green-600 dark:text-green-400">POST</span> /api/auth/register - User registration
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-blue-600 dark:text-blue-400">GET</span> /api/auth/me - Get current user
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Expense Management</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-blue-600 dark:text-blue-400">GET</span> /api/expenses - List expenses
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-green-600 dark:text-green-400">POST</span> /api/expenses - Create expense
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-yellow-600 dark:text-yellow-400">PUT</span> /api/expenses/[id] - Update expense
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-red-600 dark:text-red-400">DELETE</span> /api/expenses/[id] - Delete expense
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Family Management</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-blue-600 dark:text-blue-400">GET</span> /api/families - List families
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-green-600 dark:text-green-400">POST</span> /api/families - Create family
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-green-600 dark:text-green-400">POST</span> /api/families/join - Join family
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: HelpCircle,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Common Issues</h4>
            <div className="space-y-4">
              <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Database Connection Issues</h5>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• Check MongoDB connection string in .env.local</li>
                  <li>• Verify MongoDB service is running</li>
                  <li>• Check network connectivity and firewall settings</li>
                </ul>
              </div>
              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg">
                <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">Authentication Problems</h5>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• Clear browser cookies and localStorage</li>
                  <li>• Check JWT_SECRET in environment variables</li>
                  <li>• Verify user exists and has correct permissions</li>
                </ul>
              </div>
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Chart Display Issues</h5>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Verify Chart.js version compatibility</li>
                  <li>• Check data format in API responses</li>
                  <li>• Clear browser cache and reload</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Getting Help</h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Check this documentation first</li>
              <li>• Search existing GitHub issues</li>
              <li>• Create detailed bug reports with reproduction steps</li>
              <li>• Include environment information and error logs</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const renderSidebar = () => (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Documentation
        </h2>
        <nav className="space-y-1">
          {docSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isExpanded = expandedSections.includes(section.id);
            
            return (
              <div key={section.id}>
                <button
                  onClick={() => {
                    setActiveSection(section.id);
                    toggleSection(section.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {section.title}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );

  const activeDoc = docSections.find(section => section.id === activeSection);

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📚 Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete guide to using and developing ExpenseTracker
        </p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {renderSidebar()}
        
        <div className="flex-1 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {activeDoc && (
                  <>
                    <activeDoc.icon className="h-5 w-5 mr-2" />
                    {activeDoc.title}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeDoc?.content}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
