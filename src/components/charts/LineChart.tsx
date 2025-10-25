'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartProps, LineChartData } from '@/types/chart';
import { createLineChartOptions } from '@/lib/chartConfig';
import { useSettings } from '@/contexts/SettingsContext';

interface LineChartProps extends Omit<ChartProps, 'data'> {
  data: LineChartData;
  title?: string;
}

export default function LineChart({ data, options, className, title }: LineChartProps) {
  const { currency } = useSettings();
  const baseOptions = createLineChartOptions(currency.code);
  
  const chartOptions = {
    ...baseOptions,
    ...options,
    plugins: {
      ...baseOptions.plugins,
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
