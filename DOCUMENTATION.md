# ExpenseTracker - Complete Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features & Capabilities](#features--capabilities)
3. [Technical Architecture](#technical-architecture)
4. [Getting Started](#getting-started)
5. [User Guide](#user-guide)
6. [Admin Guide](#admin-guide)
7. [API Documentation](#api-documentation)
8. [Development Guide](#development-guide)
9. [Recent Updates](#recent-updates)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

ExpenseTracker is a comprehensive full-stack expense and income tracking application built with modern web technologies. It supports individual users, family budget management, and administrative oversight with role-based access control.

### Key Highlights
- **Multi-user Support**: Individual and family budget management
- **Role-based Access**: USER, ADMIN, and SUPERUSER roles
- **Real-time Analytics**: Interactive charts and financial insights
- **Responsive Design**: Mobile-first approach with dark mode support
- **Advanced Features**: Bulk operations, data export, and refactoring tools

---

## 🚀 Features & Capabilities

### 💰 Financial Management
- **Expense Tracking**: Add, edit, delete expenses with categories
- **Income Management**: Track multiple income sources with allocation
- **Family Budgets**: Shared family expense and income tracking
- **Categories**: Custom categories with emoji support
- **Payment Methods**: Cash, Card, Wallet, Bank Transfer support

### 📊 Analytics & Reporting
- **Dashboard**: Real-time financial overview with charts
- **Interactive Charts**: Pie, bar, line, and doughnut charts
- **Spending Patterns**: Daily, weekly, monthly analysis
- **Budget Tracking**: Progress bars and alerts
- **Data Export**: CSV and JSON export capabilities

### 👥 Family Features
- **Family Creation**: Create and manage family groups
- **Member Management**: Invite and manage family members
- **Role Assignment**: Family head, adult, and child roles
- **Shared Budgets**: Collaborative expense tracking
- **Income Allocation**: Split income between personal and family

### 🔧 Advanced Tools
- **Bulk Operations**: Select and modify multiple records
- **Data Refactoring**: Standardize categories, sources, frequencies
- **Search & Filtering**: Advanced filtering with multiple criteria
- **Command Palette**: Quick navigation (Ctrl/Cmd+/) for SUPERUSER
- **Theme Support**: Light and dark mode with system preference

### 🛡️ Security & Access Control
- **Role-based Permissions**: Granular access control
- **Family Privacy**: Secure family data isolation
- **Admin Tools**: User management and system analytics
- **Data Validation**: Comprehensive input validation and sanitization

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom components
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React icon library
- **State Management**: React hooks and context

### Backend Stack
- **API**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Custom JWT-based auth system
- **Validation**: Zod schema validation
- **File Structure**: Modular component architecture

### Key Libraries
```json
{
  "next": "14+",
  "react": "18+",
  "typescript": "5+",
  "tailwindcss": "3+",
  "mongodb": "6+",
  "mongoose": "8+",
  "chart.js": "4+",
  "lucide-react": "latest",
  "date-fns": "latest"
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or cloud)
- Package manager (npm, yarn, or pnpm)

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd expensetracker
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or yarn install
   # or pnpm install
   ```

3. **Environment Setup**
   Create `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/expensetracker
   JWT_SECRET=your-super-secret-jwt-key
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Initialization**
   ```bash
   npm run db:seed  # Initialize default categories and admin user
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   Open [http://localhost:3000](http://localhost:3000)

### Default Admin Account
- **Email**: admin@expensetracker.com
- **Password**: admin123
- **Role**: SUPERUSER

---

## 📖 User Guide

### Getting Started as a User

#### 1. Dashboard Overview
- **Summary Cards**: View total income, expenses, and net balance
- **Charts**: Analyze spending patterns and category distribution
- **Recent Transactions**: Quick view of latest activities
- **Budget Progress**: Track category-wise budget utilization

#### 2. Managing Expenses
- **Add Expense**: Click "Add Expense" button
- **Required Fields**: Amount, category, description, date
- **Optional Fields**: Payment method, family allocation
- **Bulk Operations**: Select multiple expenses for batch actions

#### 3. Income Tracking
- **Add Income**: Record income from various sources
- **Frequency Settings**: One-time, weekly, monthly, etc.
- **Family Allocation**: Split between personal and family budgets
- **Recurring Income**: Set up automatic recurring entries

#### 4. Family Management
- **Create Family**: Set up family budget group
- **Invite Members**: Send invitation codes to family members
- **Role Management**: Assign family head, adult, or child roles
- **Shared Expenses**: Track family expenses collaboratively

#### 5. Categories & Budgets
- **Custom Categories**: Create categories with emoji icons
- **Budget Setting**: Set monthly budgets per category
- **Budget Alerts**: Get notified when approaching limits
- **Category Analytics**: View spending patterns by category

### Advanced Features

#### Bulk Operations
1. **Enable Bulk Mode**: Click "Bulk Actions" button
2. **Select Items**: Use checkboxes to select records
3. **Bulk Actions**: Edit, delete, or export selected items
4. **Bulk Edit**: Update multiple fields across selected records

#### Data Refactoring
1. **Access Refactor**: Click "Refactor" button on income/expense pages
2. **Choose Type**: Select source, category, or frequency refactoring
3. **Set Values**: Define old and new values for replacement
4. **Apply Changes**: Execute refactoring across matching records

#### Command Palette (SUPERUSER)
- **Hotkey**: Press `Ctrl+/` (Windows/Linux) or `Cmd+/` (Mac)
- **Search Routes**: Type to find and navigate to any page
- **Quick Access**: Instant navigation to admin and user pages

---

## 👑 Admin Guide

### Admin Roles
- **USER**: Basic expense and income tracking
- **ADMIN**: User management and system analytics
- **SUPERUSER**: Full system access and advanced tools

### User Management (ADMIN/SUPERUSER)
1. **Access**: Navigate to Admin → User Management
2. **View Users**: See all registered users and their roles
3. **Role Management**: Promote/demote user roles
4. **User Analytics**: View user activity and statistics
5. **Account Actions**: Suspend or activate user accounts

### System Analytics (ADMIN/SUPERUSER)
1. **Access**: Navigate to Admin → System Analytics
2. **User Statistics**: Total users, active users, new registrations
3. **Financial Overview**: System-wide income and expense totals
4. **Performance Metrics**: Database performance and system health
5. **Usage Patterns**: Peak usage times and feature adoption

### Family Management
- **Family Oversight**: View all families in the system
- **Member Management**: Manage family memberships
- **Data Analytics**: Family-wise financial analytics
- **Issue Resolution**: Handle family-related disputes or issues

---

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/login     - User login
POST /api/auth/register  - User registration
POST /api/auth/logout    - User logout
GET  /api/auth/me        - Get current user
```

### Expense Management
```
GET    /api/expenses           - List expenses (with filters)
POST   /api/expenses           - Create expense
PUT    /api/expenses/[id]      - Update expense
DELETE /api/expenses/[id]      - Delete expense
POST   /api/expenses/bulk      - Bulk operations
```

### Income Management
```
GET    /api/income             - List income records
POST   /api/income             - Create income
PUT    /api/income/[id]        - Update income
DELETE /api/income/[id]        - Delete income
POST   /api/income/refactor    - Refactor income data
```

### Family Management
```
GET    /api/families           - List user families
POST   /api/families           - Create family
PUT    /api/families/[id]      - Update family
DELETE /api/families/[id]      - Delete family
POST   /api/families/join      - Join family with code
POST   /api/families/[id]/invite - Generate invite code
```

### Categories & Analytics
```
GET    /api/categories         - List categories
POST   /api/categories         - Create category
PUT    /api/categories/[id]    - Update category
DELETE /api/categories/[id]    - Delete category
GET    /api/analytics          - Dashboard analytics
GET    /api/analytics/admin    - Admin analytics
```

---

## 💻 Development Guide

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── expenses/          # Expense management
│   ├── income/            # Income management
│   ├── family/            # Family features
│   ├── categories/        # Category management
│   ├── settings/          # User settings
│   ├── admin/             # Admin pages
│   └── docs/              # Documentation route
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── charts/           # Chart components
│   └── forms/            # Form components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── models/               # Database models
├── contexts/             # React contexts
└── types/                # TypeScript definitions
```

### Development Workflow

#### 1. Setting Up Development Environment
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

#### 2. Database Development
```bash
# Connect to MongoDB
npm run db:connect

# Seed database
npm run db:seed

# Reset database
npm run db:reset

# Backup data
npm run db:backup
```

#### 3. Component Development
- Use TypeScript for all components
- Follow the existing component structure
- Implement responsive design with Tailwind CSS
- Add proper error handling and loading states
- Include accessibility features (ARIA labels, keyboard navigation)

#### 4. API Development
- Use Next.js API routes for backend functionality
- Implement proper error handling and validation
- Add authentication middleware where needed
- Document API endpoints with JSDoc comments
- Use TypeScript for request/response types

### Code Standards
- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Code formatting with consistent style
- **Tailwind CSS**: Utility-first styling approach
- **Component Structure**: Functional components with hooks

---

## 📈 Recent Updates & Changelog

### Version 2.1 - Documentation & UI Improvements (October 2025)

#### Documentation System
- **Consolidated Documentation**: Created comprehensive single-source documentation
- **Interactive Docs Route**: Added `/docs` page with sidebar navigation
- **Command Palette Integration**: Documentation accessible via Ctrl/Cmd+/
- **Cleanup**: Removed 42+ outdated documentation files
- **Streamlined Structure**: Only README.md and DOCUMENTATION.md remain

#### UI Enhancements
- **Wrapper Width**: Increased from max-w-7xl to max-w-8xl across all pages
- **Better Space Utilization**: 256px additional width on large screens
- **Consistent Layout**: Perfect alignment between navigation and content
- **Professional Appearance**: More spacious, modern design

### Version 2.0 - Major Feature Release

#### New Features Added
- **Command Palette**: Quick navigation for SUPERUSER (Ctrl/Cmd+/)
- **Income Refactoring**: Bulk data standardization tools
- **Family Budget System**: Complete family financial management
- **Advanced Analytics**: Enhanced charts and insights
- **Bulk Operations**: Multi-record selection and editing
- **Responsive Design**: Improved mobile experience

#### Core Features Implemented
- **Income Management**: Complete income tracking with allocation
- **Family Features**: Multi-user family budget management
- **Role-Based Access**: USER, ADMIN, SUPERUSER permissions
- **Category System**: Custom categories with emoji support
- **Data Export**: CSV and JSON export capabilities
- **Advanced Filtering**: Multi-criteria search and filtering

#### Technical Enhancements
- **Performance**: Optimized database queries and caching
- **Security**: Enhanced role-based access control
- **Type Safety**: Comprehensive TypeScript implementation
- **Error Handling**: Better error boundaries and user feedback
- **Code Organization**: Modular component architecture

#### Bug Fixes & Improvements
- Fixed currency conversion issues in charts
- Resolved family expense creation errors
- Improved category consistency across pages
- Fixed navigation dropdown positioning
- Resolved dark mode UI inconsistencies
- Enhanced form validation and error messages

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/expensetracker"

# Verify environment variables
echo $MONGODB_URI

# Reset database connection
npm run db:reset
```

#### Authentication Problems
- Clear browser cookies and localStorage
- Check JWT_SECRET in environment variables
- Verify user exists in database
- Check user role permissions

#### Chart Display Issues
- Verify Chart.js version compatibility
- Check data format in API responses
- Clear browser cache
- Ensure responsive container sizing

#### Family Features Not Working
- Verify family permissions in database
- Check family membership status
- Ensure proper role assignments
- Validate family invite codes

### Performance Optimization
- Enable MongoDB indexing for frequently queried fields
- Implement proper caching strategies
- Optimize image loading and chart rendering
- Use React.memo for expensive components
- Implement proper error boundaries

### Development Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Type checking
npm run type-check

# Build verification
npm run build
```

---

## 📞 Support & Contributing

### Getting Help
1. Check this documentation first
2. Search existing GitHub issues
3. Create detailed bug reports with reproduction steps
4. Include environment information and error logs

### Contributing Guidelines
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code standards and add tests
4. Commit with descriptive messages
5. Push to branch and create Pull Request

### Development Setup for Contributors
```bash
# Fork and clone
git clone https://github.com/your-username/expensetracker.git
cd expensetracker

# Install dependencies
npm install

# Set up development environment
cp .env.example .env.local
# Edit .env.local with your settings

# Start development
npm run dev
```

---

## 📄 License & Credits

### License
This project is licensed under the MIT License. See LICENSE file for details.

### Credits
- Built with Next.js, TypeScript, and MongoDB
- UI components styled with Tailwind CSS
- Charts powered by Chart.js
- Icons from Lucide React
- Date handling with date-fns

### Acknowledgments
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first approach
- MongoDB team for the flexible database
- Open source community for inspiration and tools

---

**Last Updated**: October 2025  
**Version**: 2.0  
**Maintainer**: ExpenseTracker Development Team

For the most up-to-date information, visit our [GitHub repository](https://github.com/your-repo/expensetracker).
