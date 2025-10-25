'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartProps, BarChartData } from '@/types/chart';
import { createBarChartOptions } from '@/lib/chartConfig';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/lib/currency';

interface BarChartProps extends Omit<ChartProps, 'data'> {
  data: BarChartData;
  title?: string;
  horizontal?: boolean;
}

export default function BarChart({ 
  data, 
  options, 
  className, 
  title, 
  horizontal = false 
}: BarChartProps) {
  const { currency } = useSettings();
  const baseOptions = createBarChartOptions(currency.code);
  
  const chartOptions = {
    ...baseOptions,
    ...options,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
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
    scales: {
      ...baseOptions.scales,
      ...options?.scales,
      ...(horizontal && {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function (value: any) {
              return formatCurrency(value, currency.code as any);
            },
          },
        },
        y: {
          ticks: {
            maxRotation: 0,
          },
        },
      }),
    },
  };

  return (
    <div className={`relative ${className || ''}`}>
      <Bar data={data} options={chartOptions} />
    </div>
  );
}
