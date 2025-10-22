'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartProps, LineChartData } from '@/types/chart';
import { LINE_CHART_OPTIONS } from '@/lib/chartConfig';

interface LineChartProps extends Omit<ChartProps, 'data'> {
  data: LineChartData;
  title?: string;
}

export default function LineChart({ data, options, className, title }: LineChartProps) {
  const chartOptions = {
    ...LINE_CHART_OPTIONS,
    ...options,
    plugins: {
      ...LINE_CHART_OPTIONS.plugins,
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
      <Line data={data} options={chartOptions} />
    </div>
  );
}
