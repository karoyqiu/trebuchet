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

    let text = ms.format(latency);

    if (latency <= 200) {
      return ['badge-success', text];
    }

    if (latency <= 1000) {
      return ['badge-warning', text];
    }

    if (latency > 30000) {
      text = 'Timeout';
    }

    return ['badge-error', text];
  }, [latency]);

  return <div className={clsx('badge badge-sm', color)}>{text}</div>;
}
