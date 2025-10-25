'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { ChartProps, PieChartData } from '@/types/chart';
import { createPieChartOptions } from '@/lib/chartConfig';
import { useSettings } from '@/contexts/SettingsContext';

interface PieChartProps extends Omit<ChartProps, 'data'> {
  data: PieChartData;
  title?: string;
}

export default function PieChart({ data, options, className, title }: PieChartProps) {
  const { currency } = useSettings();
  const baseOptions = createPieChartOptions(currency.code);
  
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
      <Pie data={data} options={chartOptions} />
    </div>
  );
}
