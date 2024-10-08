import DeleteIcon from '@material-symbols/svg-400/outlined/delete.svg?react';
import EditIcon from '@material-symbols/svg-400/outlined/edit.svg?react';
import RefreshIcon from '@material-symbols/svg-400/outlined/refresh.svg?react';
import React from 'react';
import { dbRemoveSubscription, dbUpdateSubscription, updateSubscription } from '../api/bindings';
import { updatingSubs } from '../api/updatingSubs';
import { Subscription, subscriptions } from '../db/subscription';
import SubscriptionDialog from './SubscriptionDialog';

type SubscriptionRowProps = {
  sub: Subscription;
  isUpdating: boolean;
  onEdit: (sub: Subscription) => void;
  onRemove: (sub: Subscription) => void;
};

const SubscriptionRow = (props: SubscriptionRowProps) => {
  const { sub, isUpdating, onEdit, onRemove } = props;

  return (
    <tr key={sub.id} className="hover">
      <td>
        <div className="tooltip tooltip-bottom" data-tip="Enabled">
          <label>
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={!sub.disabled}
              onChange={(event) =>
                dbUpdateSubscription({ ...sub, disabled: !event.target.checked })
              }
            />
          </label>
        </div>
      </td>
      <td className="w-full">
        <p className="text-lg font-bold">{sub.name}</p>
        <p className="text-sm opacity-50 truncate max-w-xl">{sub.url}</p>
      </td>
      <td>
        <div className="join">
          <div className="tooltip tooltip-bottom" data-tip={isUpdating ? 'Updating...' : 'Update'}>
            <button
              className="btn btn-ghost btn-square join-item"
              disabled={isUpdating}
              onClick={() => updateSubscription(sub.id)}
            >
              <RefreshIcon className={isUpdating ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="tooltip tooltip-bottom" data-tip="Edit">
            <button className="btn btn-ghost btn-square join-item" onClick={() => onEdit(sub)}>
              <EditIcon />
            </button>
          </div>
          <div className="tooltip tooltip-bottom" data-tip="Remove">
            <button className="btn btn-error btn-square join-item" onClick={() => onRemove(sub)}>
              <DeleteIcon />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default function SubscriptionList() {
  const [sub, setSub] = React.useState<Subscription>({ id: 0, name: '', url: '', disabled: null });
  const ref = React.useRef<HTMLDialogElement>(null);
  const items = subscriptions.use() ?? [];
  const updatings = updatingSubs.use() ?? [];

  return (
    <>
      <table className="table">
        <tbody>
          {items.map((item) => (
            <SubscriptionRow
              key={item.id}
              sub={item}
              isUpdating={updatings.includes(item.id)}
              onEdit={(sub) => {
                setSub(sub);
                console.log('Show');
                ref.current?.showModal();
              }}
              onRemove={(sub) => dbRemoveSubscription(sub.id)}
            />
          ))}
        </tbody>
      </table>
      <SubscriptionDialog
        ref={ref}
        onClose={async (values) => {
          console.log('onClose');
          ref.current?.close();

          if (values?.id) {
            await dbUpdateSubscription(values);
          }
        }}
        sub={sub}
      />
    </>
  );
}
