import { getVersion } from '@tauri-apps/api/app';
import clsx from 'clsx';
import React from 'react';
import { disable, enable, isEnabled } from 'tauri-plugin-autostart-api';
import settings from '../api/settings';

const min = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'minute',
});

export default function GeneralPage() {
  const [version, setVersion] = React.useState('');
  const [autoStart, setAutoStart] = React.useState(false);
  const us = settings.use();

  React.useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {});
    isEnabled()
      .then(setAutoStart)
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-[1fr_auto] p-12 gap-4 text-lg">
      <h1 className="col-span-2 text-6xl text-center mb-12">
        Trebuchet <span className="text-base font-mono">{`v${version}`}</span>
      </h1>
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
      <span>Autostart</span>
      <label className="cursor-pointer label flex gap-2">
        <span>{autoStart ? 'Yes' : 'No'}</span>
        <input
          type="checkbox"
          className="toggle toggle-success"
          checked={autoStart}
          onChange={async (event) => {
            setAutoStart(event.target.checked);

            if (event.target.checked) {
              await enable();
            } else {
              await disable();
            }
          }}
        />
      </label>
    </div>
  );
}
