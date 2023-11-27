const bps = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'byte-per-second',
});

const kbps = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'kilobyte-per-second',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const mbps = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'megabyte-per-second',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatSpeed = (bytesPerSecond: number) => {
  const threshold = 1024;

  if (bytesPerSecond < threshold) {
    return bps.format(bytesPerSecond);
  }

  const units = [kbps, mbps];
  let u = -1;

  do {
    bytesPerSecond /= threshold;
    u++;
  } while (bytesPerSecond > threshold && u < units.length);

  return units[u].format(bytesPerSecond);
};

type SpeedometerProps = {
  download: number;
  upload: number;
};

export default function Speedometer(props: SpeedometerProps) {
  const { download, upload } = props;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 text-sm">
      <span className="text-green-500">↑</span>
      <span className="font-mono text-end">{formatSpeed(upload)}</span>
      <span className="text-red-500">↓</span>
      <span className="font-mono text-end">{formatSpeed(download)}</span>
    </div>
  );
}
