import { appWindow } from '@tauri-apps/api/window';
import React from 'react';
import useSubscribe from './api/useSubscribe';
import SubscriptionDialog from './components/SubscriptionDialog';
import SubscriptionList from './components/SubscriptionList';
import db from './db';
import { Subscription } from './db/subscription';

function App() {
  const ref = React.useRef<HTMLDialogElement>(null);
  useSubscribe();

  const addSub = React.useCallback(
    async (values?: Subscription) => {
      ref.current?.close();

      if (values) {
        await db.subs.add(values);
      }
    },
    [ref]
  );

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
      <button className="btn btn-ghost btn-sm" onClick={() => ref.current?.showModal()}>
        <span className="material-symbols-outlined">add</span>
        Subscribe
      </button>
      <SubscriptionDialog ref={ref} onClose={addSub} sub={{ name: '', url: '' }} />
    </div>
  );
}

export default App;
