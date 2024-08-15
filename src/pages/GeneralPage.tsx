import EditIcon from '@material-symbols/svg-400/outlined/edit.svg?react';
import { getVersion } from '@tauri-apps/api/app';
import React from 'react';
import { disable, enable, isEnabled } from 'tauri-plugin-autostart-api';
import { selectFastestEndpoint, setCurrentEndpoint, type Settings } from '../api/bindings';
import { current } from '../api/currentEndpoint';
import { updateSettings, useSettings } from '../api/settings';
import useInputBox from '../api/useInputBox';
import FlowChart from '../components/FlowChart';
import WebsiteSelectDialog from '../components/WebsiteSelectDialog';

const min = new Intl.NumberFormat(navigator.language, {
  style: 'unit',
  unit: 'minute',
});

export default function GeneralPage() {
  const [version, setVersion] = React.useState('');
  const [autoStart, setAutoStart] = React.useState(false);
  const prompt = useInputBox();
  const settings = useSettings();
  const websiteRef = React.useRef<HTMLDialogElement>(null);
  const cur = current.use();

  const updateAndRestart = async (delta: Partial<Settings>) => {
    await updateSettings(delta);

    if (cur) {
      await setCurrentEndpoint(cur);
    } else {
      await selectFastestEndpoint();
    }
  };

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
            await updateAndRestart({ socksPort: value });
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
            await updateAndRestart({ httpPort: value });
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
            await updateAndRestart({ allowLan: event.target.checked });
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
            await updateSettings({ subUpdateInterval: value });
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
            await updateSettings({ epTestInterval: value });
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
            await updateSettings({ epTestConcurrency: value });
          }
        }}
      >
        <EditIcon />
      </button>

      <span>Latency test URL</span>
      <span className="font-mono text-end">{settings.epTestUrl}</span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={() => {
          websiteRef.current?.showModal();
        }}
      >
        <EditIcon />
      </button>
      <WebsiteSelectDialog
        ref={websiteRef}
        url={settings.epTestUrl}
        onClose={async (value) => {
          if (value) {
            await updateSettings({ epTestUrl: value });
          }
        }}
      />

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
