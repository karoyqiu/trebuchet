import React from 'react';
import { updateSubscriptions } from '../api/subscription';
import MaterialSymbol from '../components/MaterialSymbol';
import SubscriptionDialog from '../components/SubscriptionDialog';
import SubscriptionList from '../components/SubscriptionList';
import db from '../db';
import { Subscription } from '../db/subscription';

export default function SubscriptionPage() {
  const ref = React.useRef<HTMLDialogElement>(null);

  const addSub = React.useCallback(
    async (values?: Subscription) => {
      ref.current?.close();

      if (values) {
        await db.subs.add(values);
      }
    },
    [ref]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="join p-2">
        <button className="btn btn-ghost join-item" onClick={() => ref.current?.showModal()}>
          <MaterialSymbol symbol="add" />
          Add
        </button>
        <button className="btn btn-ghost join-item" onClick={() => updateSubscriptions()}>
          <MaterialSymbol symbol="update" />
          Update all
        </button>
      </div>
      <div className="divider m-0 h-0" />
      <div className="min-h-0 grow overflow-y-auto">
        <SubscriptionList />
      </div>
      <SubscriptionDialog ref={ref} onClose={addSub} sub={{ name: '', url: '' }} />
    </div>
  );
}
