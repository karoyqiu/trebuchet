import EditIcon from '@material-symbols/svg-400/outlined/edit.svg?react';
import { getVersion } from '@tauri-apps/api/app';
import React from 'react';
import { disable, enable, isEnabled } from 'tauri-plugin-autostart-api';
import { selectFastest } from '../api/currentEndpoint';
import { updateSettings, useSettings } from '../api/settings';
import useInputBox from '../api/useInputBox';
import FlowChart from '../components/FlowChart';

const min = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'minute',
});

export default function GeneralPage() {
  const [version, setVersion] = React.useState('');
  const [autoStart, setAutoStart] = React.useState(false);
  const prompt = useInputBox();
  const settings = useSettings();

  React.useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {});
    isEnabled()
      .then(setAutoStart)
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center p-12 gap-4 h-full text-lg">
      <h1 className="col-span-3 text-6xl text-center mb-12">
        Trebuchet <span className="text-base font-mono">{`v${version}`}</span>
      </h1>

      <span>SOCKS5 port</span>
      <span className="font-mono text-end">{settings.socksPort}</span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={async () => {
          const value = await prompt({
            label: 'SOCKS5 port:',
            numeric: true,
            value: settings.socksPort,
          });

          if (value) {
            updateSettings({ socksPort: value });
            await selectFastest(true);
          }
        }}
      >
        <EditIcon />
      </button>

      <span>HTTP port</span>
      <span className="font-mono text-end">{settings.httpPort}</span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={async () => {
          const value = await prompt({
            label: 'HTTP port:',
            numeric: true,
            value: settings.httpPort,
          });

          if (value) {
            updateSettings({ httpPort: value });
            await selectFastest(true);
          }
        }}
      >
        <EditIcon />
      </button>

      <span>Allow LAN</span>
      <label className="col-span-2 cursor-pointer label flex gap-2 justify-end p-0">
        <span>{settings.allowLan ? 'Yes' : 'No'}</span>
        <input
          type="checkbox"
          className="toggle toggle-success"
          checked={!!settings.allowLan}
          onChange={async (event) => {
            updateSettings({ allowLan: event.target.checked });
            await selectFastest(true);
          }}
        />
      </label>

      {/* <span>Subscription update interval</span>
      <span className="font-mono text-end">{min.format(settings.subUpdateInterval)}</span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={async () => {
          const value = await prompt({
            label: 'Subscription update interval in minutes:',
            numeric: true,
            value: settings.subUpdateInterval,
          });

          if (value) {
            updateSettings({ subUpdateInterval: value });
          }
        }}
      >
        <EditIcon />
      </button> */}

      <span>Latency test interval</span>
      <span className="font-mono text-end">{min.format(settings.epTestInterval)}</span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={async () => {
          const value = await prompt({
            label: 'Latency test interval in minutes:',
            numeric: true,
            value: settings.epTestInterval,
          });

          if (value) {
            updateSettings({ epTestInterval: value });
          }
        }}
      >
        <EditIcon />
      </button>

      <span>Latency test concurrency</span>
      <span className="font-mono text-end">{settings.epTestConcurrency}</span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={async () => {
          const value = await prompt({
            label: 'Latency test concurrency:',
            numeric: true,
            value: settings.epTestConcurrency,
          });

          if (value) {
            updateSettings({ epTestConcurrency: value });
          }
        }}
      >
        <EditIcon />
      </button>

      <span>Latency test URL</span>
      <span className="font-mono text-end">{settings.epTestUrl}</span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={async () => {
          const value = await prompt({
            label: 'Latency test URL:',
            value: settings.epTestUrl,
          });

          if (value) {
            updateSettings({ epTestUrl: value });
          }
        }}
      >
        <EditIcon />
      </button>

      <span>Autostart</span>
      <label className="col-span-2 cursor-pointer label flex gap-2 justify-end p-0">
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

      <div className="col-span-3 h-full">
        <FlowChart />
      </div>
    </div>
  );
}
