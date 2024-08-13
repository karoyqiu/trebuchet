import AddIcon from '@material-symbols/svg-400/outlined/add.svg?react';
import UpdateIcon from '@material-symbols/svg-400/outlined/update.svg?react';
import React from 'react';
import { dbInsertSubscription } from '../api/bindings';
import { updateSubscriptions } from '../api/subscription';
import SubscriptionDialog from '../components/SubscriptionDialog';
import SubscriptionList from '../components/SubscriptionList';
import { Subscription } from '../db/subscription';

export default function SubscriptionPage() {
  const ref = React.useRef<HTMLDialogElement>(null);

  const addSub = React.useCallback(
    async (values?: Subscription) => {
      ref.current?.close();

      if (values) {
        await dbInsertSubscription(values);
      }
    },
    [ref],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="join p-2">
        <button className="btn btn-ghost join-item" onClick={() => ref.current?.showModal()}>
          <AddIcon />
          Add
        </button>
        <button className="btn btn-ghost join-item" onClick={() => updateSubscriptions()}>
          <UpdateIcon />
          Update all
        </button>
      </div>
      <div className="divider m-0 h-0" />
      <div className="min-h-0 grow overflow-y-auto">
        <SubscriptionList />
      </div>
      <SubscriptionDialog
        ref={ref}
        onClose={addSub}
        sub={{ id: 0, name: '', url: '', disabled: null }}
      />
    </div>
  );
}
