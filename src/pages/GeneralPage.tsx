import clsx from 'clsx';
import settings from '../api/settings';

const min = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'minute',
});

export default function GeneralPage() {
  const us = settings.use();

  return (
    <div className="grid grid-cols-[1fr_auto] p-12 gap-4 text-lg">
      <h1 className="col-span-2 text-6xl text-center mb-12">Trebuchet</h1>
      <span>SOCKS5 port</span>
      <span className="font-mono text-end">{us.socksPort}</span>
      <span>HTTP port</span>
      <span className="font-mono text-end">{us.httpPort}</span>
      <span>Allow LAN</span>
      <div className="flex gap-2 items-center justify-end">
        <span className={clsx('badge badge-xs', us.allowLan ? 'badge-success' : 'badge-error')} />
        <span>{us.allowLan ? 'Yes' : 'No'}</span>
      </div>
      <span>Subscription update interval</span>
      <span className="font-mono text-end">{min.format(us.subUpdateInterval)}</span>
      <span>Latency test interval</span>
      <span className="font-mono text-end">{min.format(us.epTestInterval)}</span>
    </div>
  );
}
