import { getMatches } from '@tauri-apps/api/cli';
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { useLiveQuery } from 'dexie-react-hooks';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { dbSetSettings } from './api/bindings';
import settings from './api/settings';
import { updateSubscriptions } from './api/subscription';
import useStats from './api/useStats';
import useSubscribe from './api/useSubscribe';
import Alert from './components/Alert';
import ConnectionState from './components/ConnectionState';
import InputBoxProvider from './components/InputBoxProvider';
import LinkMenuItem from './components/LinkMenuItem';
import Speedometer from './components/Speedometer';
import db from './db';
import { subscriptionsCount } from './db/subscription';
import useListenDbChange from './db/useListenDbChange';

// 更新 geoip.dat & geosite.dat
const updateGeosites = async () => {
  await Promise.allSettled([
    invoke('download_resource', {
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat',
      filename: 'geoip.dat',
    }),
    invoke('download_resource', {
      url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat',
      filename: 'geosite.dat',
    }),
  ]);
};

function App() {
  const epCount = useLiveQuery(() => db.endpoints.count(), []);
  const subCount = subscriptionsCount.use() ?? 0;

  // 加载完成之后再显示窗口
  React.useEffect(() => {
    getMatches()
      .then((matches) => {
        if (!matches.args.autostart || !matches.args.autostart.value) {
          return appWindow.show();
        }
      })
      .then(updateSubscriptions)
      .catch(() => {});

    // 每 12 小时更新
    const timer = setInterval(updateGeosites, 12 * 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useSubscribe();

  const stats = useStats();

  React.useEffect(() => {
    const s = settings.get();
    dbSetSettings(s);
  }, []);

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
