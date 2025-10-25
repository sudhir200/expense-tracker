# Expense Tracker

A comprehensive full-stack expense tracking application built with Next.js 14+, TypeScript, MongoDB, and Chart.js. Track your expenses, visualize spending patterns, and manage budgets with a beautiful, responsive interface.

## Features

### 🏠 Dashboard & Analytics
- **Summary Cards**: Total expenses, budget remaining, transaction count, and daily averages
- **Interactive Charts**: 
  - Pie chart for category distribution
  - Bar charts for monthly comparisons and top categories
  - Line chart for daily spending trends
  - Doughnut chart for budget overview
- **Recent Transactions**: Quick view of latest expenses
- **Budget Progress**: Visual progress bars for category budgets

### 💰 Expense Management
- **Add/Edit/Delete** expenses with full validation
- **Expense Details**: Amount, category, description, date, payment method
- **Payment Methods**: Cash, Card, Wallet, Bank Transfer
- **Bulk Operations**: Export data to CSV/JSON

### 🔍 Advanced Filtering & Search
- **Text Search**: Search by description
- **Date Filters**: Today, this week, this month, or custom date range
- **Category Filters**: Multi-select category filtering
- **Payment Method Filters**: Filter by payment methods
- **Amount Range**: Min/max amount filtering
- **Active Filter Display**: Visual indicators for applied filters

### 📊 Categories & Budgets
- **Predefined Categories**: Food, Transportation, Entertainment, Shopping, Bills, Healthcare, Education, Other
- **Custom Categories**: Add your own categories with custom colors
- **Budget Management**: Set monthly budgets per category
- **Budget Alerts**: Visual indicators when approaching limits

### 🎨 UI/UX Features
- **Responsive Design**: Mobile-first approach with beautiful layouts
- **Dark Mode**: Full dark mode support with theme switching
- **Loading States**: Skeleton loaders and loading indicators
- **Error Handling**: User-friendly error messages and recovery
- **Form Validation**: Real-time validation with helpful error messages
- **Smooth Animations**: Transitions and hover effects

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Charts**: Chart.js with react-chartjs-2
- **UI Components**: Custom components with Tailwind CSS
- **Icons**: Lucide React
- **Utilities**: date-fns, clsx, tailwind-merge

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or cloud)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Setup

The application will automatically:
- Connect to your MongoDB database
- Create the necessary collections (expenses, categories, budgets)
- Initialize default categories on first run

No manual database setup is required!

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── expenses/      # Expense CRUD operations
│   │   ├── analytics/     # Dashboard analytics
│   │   ├── categories/    # Category management
│   │   └── budget/        # Budget management
│   ├── dashboard/         # Dashboard page
│   ├── expenses/          # Expenses management page
│   └── layout.tsx         # Root layout with navigation
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── charts/           # Chart.js components
│   ├── expense/          # Expense-specific components
│   ├── Dashboard.tsx     # Main dashboard component
│   ├── FilterBar.tsx     # Advanced filtering component
│   └── Navigation.tsx    # App navigation
├── hooks/                # Custom React hooks
│   ├── useExpenses.ts    # Expense data management
│   └── useAnalytics.ts   # Analytics data fetching
├── lib/                  # Utility libraries
│   ├── mongodb.ts        # Database connection
│   ├── chartConfig.ts    # Chart.js configuration
│   ├── utils.ts          # Helper functions
│   └── export.ts         # Data export utilities
├── models/               # Mongoose schemas
│   ├── Expense.ts        # Expense model
│   ├── Category.ts       # Category model
│   └── Budget.ts         # Budget model
└── types/                # TypeScript definitions
    ├── expense.ts        # Expense-related types
    └── chart.ts          # Chart-related types
```

## API Endpoints

### Expenses
- `GET /api/expenses` - Fetch expenses with filtering and pagination
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Analytics
- `GET /api/analytics` - Get dashboard analytics data

### Categories
- `GET /api/categories` - Fetch all categories
- `POST /api/categories` - Create custom category
- `PUT /api/categories?action=initialize` - Initialize default categories

### Budget
- `GET /api/budget` - Fetch budgets for a month
- `POST /api/budget` - Create/update budget
- `PUT /api/budget` - Bulk update budgets
- `DELETE /api/budget` - Delete budget

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

Make sure to:
1. Set the `MONGODB_URI` environment variable
2. Ensure your MongoDB database is accessible from the deployment platform

## Features in Detail

### Expense Management
- **Form Validation**: Real-time validation with helpful error messages
- **Date Handling**: Automatic date formatting and validation
- **Category Selection**: Dropdown with all available categories
- **Payment Methods**: Support for multiple payment types

### Analytics Dashboard
- **Real-time Data**: Charts update automatically when data changes
- **Interactive Charts**: Hover effects and tooltips with detailed information
- **Responsive Charts**: Charts adapt to different screen sizes
- **Color Consistency**: Category colors are consistent across all charts

### Filtering System
- **Advanced Filters**: Multiple filter types can be combined
- **Real-time Search**: Instant search results as you type
- **Filter Persistence**: Filters remain active during navigation
- **Clear Filters**: Easy way to reset all filters

### Data Export
- **CSV Export**: Export filtered data to CSV format
- **JSON Export**: Export data in JSON format for developers
- **Report Generation**: Generate formatted expense reports

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

For comprehensive documentation, visit the **Documentation** page in the application:
- **In-App**: Navigate to `/docs` or use the Documentation link in the user menu
- **Command Palette**: Press `Ctrl+/` (or `Cmd+/` on Mac) and search for "Documentation" (SUPERUSER only)

The documentation includes:
- Complete user guide and tutorials
- Admin and developer guides  
- API documentation
- Troubleshooting and FAQ
- Recent updates and changelog

## Support

If you encounter any issues or have questions:

1. Check the in-app Documentation at `/docs`
2. Review the [Issues](https://github.com/your-repo/expense-tracker/issues) page
3. Create a new issue with detailed information
4. Include steps to reproduce any bugs

## Roadmap

- [ ] User authentication with NextAuth.js
- [ ] Multi-currency support
- [ ] Receipt image upload
- [ ] Recurring expenses
- [ ] Income tracking
- [ ] Advanced reporting
- [ ] Mobile app (React Native)
- [ ] Data backup/restore
- [ ] Spending insights and recommendations

---

Built with ❤️ using Next.js, TypeScript, and MongoDB
