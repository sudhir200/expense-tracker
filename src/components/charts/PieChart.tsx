'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { ChartProps, PieChartData } from '@/types/chart';
import { PIE_CHART_OPTIONS } from '@/lib/chartConfig';

interface PieChartProps extends Omit<ChartProps, 'data'> {
  data: PieChartData;
  title?: string;
}

export default function PieChart({ data, options, className, title }: PieChartProps) {
  const chartOptions = {
    ...PIE_CHART_OPTIONS,
    ...options,
    plugins: {
      ...PIE_CHART_OPTIONS.plugins,
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
      <Pie data={data} options={chartOptions} />
    </div>
  );
}
