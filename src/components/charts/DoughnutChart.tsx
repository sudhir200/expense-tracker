'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ChartProps, DoughnutChartData } from '@/types/chart';
import { DOUGHNUT_CHART_OPTIONS } from '@/lib/chartConfig';

interface DoughnutChartProps extends Omit<ChartProps, 'data'> {
  data: DoughnutChartData;
  title?: string;
  centerText?: string;
  centerSubtext?: string;
}

export default function DoughnutChart({ 
  data, 
  options, 
  className, 
  title, 
  centerText, 
  centerSubtext 
}: DoughnutChartProps) {
  const chartOptions = {
    ...DOUGHNUT_CHART_OPTIONS,
    ...options,
    plugins: {
      ...DOUGHNUT_CHART_OPTIONS.plugins,
      ...options?.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      },
    },
  };

  return (
    <div className={`relative ${className || ''}`}>
      <Doughnut data={data} options={chartOptions} />
      {(centerText || centerSubtext) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerText && (
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {centerText}
            </div>
          )}
          {centerSubtext && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {centerSubtext}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
