import ChartStreaming from '@robloche/chartjs-plugin-streaming';
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { flowLogs } from '../db/flowLog';
import { formatSpeed } from './Speedometer';

ChartJS.register(Filler, LineElement, LinearScale, PointElement, Tooltip, ChartStreaming);

export default function FlowChart() {
  const [su, er] = React.useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return [style.getPropertyValue('--su'), style.getPropertyValue('--er')];
  }, []);
  const logs = flowLogs.use() ?? [];

  return (
    <Line
      data={{
        labels: logs.map((log) => log.ts * 1000),
        datasets: [
          {
            label: 'Upload',
            data: logs.map((log) => log.upload),
            borderColor: `oklch(${er})`,
            backgroundColor: `oklch(${er} / .4)`,
            cubicInterpolationMode: 'monotone',
            tension: 0.2,
            fill: true,
          },
          {
            label: 'Download',
            data: logs.map((log) => log.download),
            borderColor: `oklch(${su})`,
            backgroundColor: `oklch(${su} / .4)`,
            cubicInterpolationMode: 'monotone',
            tension: 0.2,
            fill: true,
          },
        ],
      }}
      options={{
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          point: {
            radius: 1,
            hoverRadius: 3,
          },
        },
        scales: {
          x: {
            type: 'realtime',
          },
          y: {
            beginAtZero: true,
            min: 0,
            ticks: {
              stepSize: 1,
              callback: (value) => {
                return formatSpeed(value as number);
              },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'nearest',
          axis: 'x',
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (item) => {
                let label = item.dataset.label ?? '';

                if (label) {
                  label += ': ';
                }

                if (item.parsed.y !== null) {
                  label += formatSpeed(item.parsed.y);
                }

                return label;
              },
            },
          },
          streaming: {
            duration: 60000,
            ttl: 2000,
            delay: 1000,
          },
        },
      }}
    />
  );
}
