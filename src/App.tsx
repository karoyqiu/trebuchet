import { appWindow } from '@tauri-apps/api/window';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { updateSubscriptions } from './api/subscription';
import useSubscribe from './api/useSubscribe';
import Alert from './components/Alert';
import ConnectionState from './components/ConnectionState';
import LinkMenuItem from './components/LinkMenuItem';
import Speedometer from './components/Speedometer';

function App() {
  useSubscribe();

  // 加载完成之后再显示窗口
  React.useEffect(() => {
    appWindow
      .show()
      .then(updateSubscriptions)
      .catch(() => {});
  }, []);

  return (
    <div className="flex w-full h-full">
      <SnackbarProvider
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        Components={{ default: Alert, success: Alert, error: Alert, warning: Alert, info: Alert }}
      />
      <div className="flex flex-col w-48 bg-base-300">
        <div className="p-6">
          <Speedometer download={0} upload={0} />
        </div>
        <div className="divider my-0" />
        <nav className="flex-1">
          <ul className="menu text-base gap-2">
            <li>
              <LinkMenuItem to="/">General</LinkMenuItem>
            </li>
            <li>
              <LinkMenuItem to="ep">Endpoints</LinkMenuItem>
            </li>
            <li>
              <LinkMenuItem to="sub">Subscriptions</LinkMenuItem>
            </li>
          </ul>
        </nav>
        <div className="divider my-0" />
        <div className="p-4">
          <ConnectionState connected={false} seconds={12345} />
        </div>
      </div>
      <div className="flex-1 max-h-full">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
