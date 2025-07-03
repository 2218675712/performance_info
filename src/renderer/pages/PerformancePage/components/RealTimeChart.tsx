import React from 'react';
import ReactECharts from 'echarts-for-react';
import _ from 'lodash';

interface RealTimeChartProps {
  data: number[];
  color: string;
}

function RealTimeChart({ data, color }: RealTimeChartProps) {
  const getOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        formatter: ([{ value }]: [{ value: number }]) => {
          return `${value.toFixed(2)}%`;
        },
      },
      xAxis: {
        type: 'category',
        data: _.range(data.length),
        show: false,
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: (value: number) => {
            if (value === 0) return '0%';
            if (value === 100) return '100%';
            return '';
          },
          color: '#888',
        },
        splitLine: {
          lineStyle: {
            color: '#333',
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      series: [
        {
          data,
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color,
            width: 1,
          },
          areaStyle: {
            color,
            opacity: 0.3,
          },
        },
      ],
      grid: {
        left: '40px',
        right: '10px',
        top: '10px',
        bottom: '20px',
      },
    };
  };

  return (
    <ReactECharts
      option={getOption()}
      style={{ height: '120px', width: '100%' }}
    />
  );
}

export default RealTimeChart;
