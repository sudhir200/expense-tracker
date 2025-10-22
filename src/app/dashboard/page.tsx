import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your expenses and analyze your spending patterns
        </p>
      </div>
      
      <Dashboard />
    </div>
  );
}
