import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface RealTimeChartProps {
  data: number[];
  color: string;
}

function RealTimeChart({ data, color }: RealTimeChartProps) {
  const chartData = data.map((value, index) => ({
    name: index.toString(),
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id={`colorUv-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={false} axisLine={false} />
        <YAxis tick={{ fill: '#9ca3af' }} />
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <Tooltip
          formatter={(value: number) => `${value.toFixed(2)}%`}
          contentStyle={{
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            borderColor: '#4b5563',
            color: '#d1d5db',
          }}
          itemStyle={{ color: '#d1d5db' }}
          labelStyle={{ display: 'none' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fillOpacity={1}
          fill={`url(#colorUv-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default RealTimeChart;
