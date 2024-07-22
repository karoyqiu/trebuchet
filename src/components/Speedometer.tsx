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

const b = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'byte',
});

const kb = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'kilobyte',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const mb = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'megabyte',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatNumber = (value: number, units: Intl.NumberFormat[]) => {
  const threshold = 1024;

  if (value < threshold) {
    return units[0].format(value);
  }

  let u = 0;

  do {
    value /= threshold;
    u++;
  } while (value > threshold && u < units.length - 1);

  return units[u].format(value);
};

export const formatSpeed = (bytesPerSecond: number) =>
  formatNumber(bytesPerSecond, [bps, kbps, mbps]);
export const formatAmount = (bytes: number) => formatNumber(bytes, [b, kb, mb]);

type SpeedometerProps = {
  download: number;
  upload: number;
  totalDownload: number;
  totalUpload: number;
};

export default function Speedometer(props: SpeedometerProps) {
  const { download, upload, totalDownload, totalUpload } = props;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 text-sm items-center">
      <span className="text-error">↑</span>
      <span className="font-mono text-end">
        {formatSpeed(upload)}
        <br />
        {formatAmount(totalUpload)}
      </span>
      <span className="text-success">↓</span>
      <span className="font-mono text-end">
        {formatSpeed(download)}
        <br />
        {formatAmount(totalDownload)}
      </span>
    </div>
  );
}
