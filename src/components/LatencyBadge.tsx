import clsx from 'clsx';
import React from 'react';

const ms = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'millisecond',
});

type LatencyBadgeProps = {
  latency: number;
};

export default function LatencyBadge(props: LatencyBadgeProps) {
  const { latency } = props;
  const [color, text] = React.useMemo(() => {
    if (latency < 0) {
      return ['badge-info', 'Testing'];
    }

    if (latency === 0) {
      return [null, 'Untested'];
    }

    const text = ms.format(latency);

    if (latency <= 1000) {
      return ['badge-success', text];
    }

    if (latency <= 3000) {
      return ['badge-warning', text];
    }

    if (latency <= 30000) {
      return ['badge-error', text];
    }

    return ['badge-ghost', 'Timeout'];
  }, [latency]);

  return <div className={clsx('badge badge-sm font-mono', color)}>{text}</div>;
}
