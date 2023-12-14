import { CategoryScale, Chart as ChartJS, LineElement, LinearScale, PointElement } from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale);

export default function FlowChart() {
  const [su, er] = React.useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return [style.getPropertyValue('--su'), style.getPropertyValue('--er')];
  }, []);

  return (
    <Line
      options={{ responsive: true, maintainAspectRatio: false }}
      data={{
        labels: ['A', 'B', 'C', 'D', 'E'],
        datasets: [
          {
            data: [1, 2, 3, 4, 5],
            borderColor: `oklch(${su})`,
          },
          {
            data: [12, 32, 33, 14, 55],
            borderColor: `oklch(${er})`,
          },
        ],
      }}
    />
  );
}
