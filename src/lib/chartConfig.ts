import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Default category colors
export const DEFAULT_CATEGORY_COLORS = {
  Food: '#FF6384',
  Transportation: '#36A2EB',
  Entertainment: '#FFCE56',
  Shopping: '#4BC0C0',
  Bills: '#9966FF',
  Healthcare: '#FF9F40',
  Education: '#FF6384',
  Other: '#C9CBCF',
};

// Chart color palette
export const CHART_COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FF6384',
  '#C9CBCF',
  '#4BC0C0',
  '#FF6384',
];

// Default chart options
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function (context: any) {
          const label = context.dataset.label || '';
          const value = context.parsed.y || context.parsed;
          return `${label}: $${value.toFixed(2)}`;
        },
      },
    },
  },
};

// Pie chart specific options
export const PIE_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  plugins: {
    ...DEFAULT_CHART_OPTIONS.plugins,
    legend: {
      ...DEFAULT_CHART_OPTIONS.plugins.legend,
      position: 'right' as const,
    },
  },
};

// Doughnut chart specific options
export const DOUGHNUT_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  plugins: {
    ...DEFAULT_CHART_OPTIONS.plugins,
    legend: {
      ...DEFAULT_CHART_OPTIONS.plugins.legend,
      position: 'right' as const,
    },
  },
  cutout: '60%',
};

// Bar chart specific options
export const BAR_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (value: any) {
          return '$' + value.toFixed(0);
        },
      },
    },
  },
};

// Line chart specific options
export const LINE_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (value: any) {
          return '$' + value.toFixed(0);
        },
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 4,
      hoverRadius: 6,
    },
  },
};

// Dark mode chart options
export const DARK_MODE_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  plugins: {
    ...DEFAULT_CHART_OPTIONS.plugins,
    legend: {
      ...DEFAULT_CHART_OPTIONS.plugins.legend,
      labels: {
        ...DEFAULT_CHART_OPTIONS.plugins.legend.labels,
        color: '#fff',
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#fff',
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
    y: {
      ticks: {
        color: '#fff',
        callback: function (value: any) {
          return '$' + value.toFixed(0);
        },
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
};

// Default categories with colors
export const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#FF6384', icon: '🍕', isDefault: true },
  { name: 'Transportation', color: '#36A2EB', icon: '🚗', isDefault: true },
  { name: 'Entertainment', color: '#FFCE56', icon: '🎬', isDefault: true },
  { name: 'Shopping', color: '#4BC0C0', icon: '🛍️', isDefault: true },
  { name: 'Bills', color: '#9966FF', icon: '💡', isDefault: true },
  { name: 'Healthcare', color: '#FF9F40', icon: '🏥', isDefault: true },
  { name: 'Education', color: '#FF6384', icon: '📚', isDefault: true },
  { name: 'Other', color: '#C9CBCF', icon: '📦', isDefault: true },
];
