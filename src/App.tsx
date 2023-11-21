import { appWindow } from '@tauri-apps/api/window';
import React from 'react';
import useSubscribe from './api/useSubscribe';
import SubscriptionList from './components/SubscriptionList';

function App() {
  useSubscribe();

  // const sub = React.useCallback(async (values?: Subscription) => {
  //   setOpen(false);

  //   if (values) {
  //     await db.subs.add(values);
  //   }
  // }, []);

  // 加载完成之后再显示窗口
  React.useEffect(() => {
    appWindow.show().catch(() => {});
  }, []);

  return (
    <div role="tablist" className="tabs tabs-lifted">
      <input role="tab" name="main-tab" className="tab" type="radio" aria-label="Endpoints" />
      <div role="tabpanel" className="tab-content bg-base-100 border-base-300">
        Tab content 1
      </div>
      <input
        role="tab"
        name="main-tab"
        className="tab"
        type="radio"
        aria-label="Subscriptions"
        defaultChecked
      />
      <div role="tabpanel" className="tab-content bg-base-100 border-base-300">
        <SubscriptionList />
      </div>
      <button className="btn btn-ghost btn-sm">
        <span className="material-symbols-outlined">add</span>
        Subscribe
      </button>
    </div>
  );
}

export default App;
