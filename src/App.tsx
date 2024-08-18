import { getMatches } from '@tauri-apps/api/cli';
import { appWindow } from '@tauri-apps/api/window';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Outlet } from 'react-router-dom';
import useStats from './api/useStats';
import Alert from './components/Alert';
import ConnectionState from './components/ConnectionState';
import InputBoxProvider from './components/InputBoxProvider';
import LinkMenuItem from './components/LinkMenuItem';
import Speedometer from './components/Speedometer';
import { endpointCount } from './db/endpoint';
import { subscriptionCount } from './db/subscription';
import useListenDbChange from './db/useListenDbChange';

function App() {
  const epCount = endpointCount.use() ?? 0;
  const subCount = subscriptionCount.use() ?? 0;

  // 加载完成之后再显示窗口
  React.useEffect(() => {
    getMatches()
      .then((matches) => {
        if (!matches.args.autostart || !matches.args.autostart.value) {
          return appWindow.show();
        }
      })
      .catch(() => {});
  }, []);

  const stats = useStats();

  useListenDbChange();

  return (
    <div className="flex w-full h-full">
      <SnackbarProvider
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        Components={{ default: Alert, success: Alert, error: Alert, warning: Alert, info: Alert }}
      />
      <div className="flex flex-col w-48 bg-base-300">
        <div className="px-6 pt-3">
          <Speedometer
            download={stats.deltaDownload}
            upload={stats.deltaUpload}
            totalDownload={stats.totalDownload}
            totalUpload={stats.totalUpload}
          />
        </div>
        <div className="divider my-0" />
        <nav className="flex-1">
          <ul className="menu text-base gap-2">
            <li>
              <LinkMenuItem to="/">General</LinkMenuItem>
            </li>
            <li>
              <LinkMenuItem to="ep">
                Endpoints
                <div className="badge badge-sm badge-primary font-mono">{epCount}</div>
              </LinkMenuItem>
            </li>
            <li>
              <LinkMenuItem to="sub">
                Subscriptions
                <div className="badge badge-sm badge-primary font-mono">{subCount}</div>
              </LinkMenuItem>
            </li>
            <li>
              <LinkMenuItem to="rule">Rules</LinkMenuItem>
            </li>
            <li>
              <LinkMenuItem to="log">Log</LinkMenuItem>
            </li>
          </ul>
        </nav>
        <div className="divider my-0" />
        <div className="p-4">
          <ConnectionState connected={stats.connected} seconds={stats.uptime} />
        </div>
      </div>
      <div className="flex-1 max-h-full">
        <InputBoxProvider>
          <Outlet />
        </InputBoxProvider>
      </div>
    </div>
  );
}

export default App;
