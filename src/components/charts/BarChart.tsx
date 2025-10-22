'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartProps, BarChartData } from '@/types/chart';
import { BAR_CHART_OPTIONS } from '@/lib/chartConfig';

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
  const chartOptions = {
    ...BAR_CHART_OPTIONS,
    ...options,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    plugins: {
      ...BAR_CHART_OPTIONS.plugins,
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
      ...BAR_CHART_OPTIONS.scales,
      ...options?.scales,
      ...(horizontal && {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function (value: any) {
              return '$' + value.toFixed(0);
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
