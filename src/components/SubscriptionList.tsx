import DeleteIcon from '@material-symbols/svg-400/outlined/delete.svg?react';
import EditIcon from '@material-symbols/svg-400/outlined/edit.svg?react';
import RefreshIcon from '@material-symbols/svg-400/outlined/refresh.svg?react';
import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';
import { updateSubscription } from '../api/subscription';
import useSubscriptionUpdating from '../api/useSubscriptionUpdating';
import db from '../db';
import { Subscription } from '../db/subscription';
import SubscriptionDialog from './SubscriptionDialog';

const enableSub = (id: number, enabled: boolean) => db.subs.update(id, { disabled: !enabled });

type SubscriptionRowProps = {
  sub: Subscription;
  onEdit: (sub: Subscription) => void;
};

const SubscriptionRow = (props: SubscriptionRowProps) => {
  const { sub, onEdit } = props;
  const isUpdating = useSubscriptionUpdating(sub.id!);

  return (
    <tr key={sub.id} className="hover">
      <td>
        <div className="tooltip tooltip-bottom" data-tip="Enabled">
          <label>
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={!sub.disabled}
              onChange={(event) => enableSub(sub.id!, event.target.checked)}
            />
          </label>
        </div>
      </td>
      <td className="w-full">
        <p className="text-lg font-bold">{sub.name}</p>
        <p className="text-sm opacity-50">{sub.url}</p>
      </td>
      <td>
        <div className="join">
          <div className="tooltip tooltip-bottom" data-tip={isUpdating ? 'Updating...' : 'Update'}>
            <button
              className="btn join-item"
              disabled={isUpdating}
              onClick={() => updateSubscription(sub)}
            >
              <RefreshIcon className={isUpdating ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="tooltip tooltip-bottom" data-tip="Edit">
            <button className="btn join-item" onClick={() => onEdit(sub)}>
              <EditIcon />
            </button>
          </div>
          <div className="tooltip tooltip-bottom" data-tip="Remove">
            <button className="btn btn-error join-item">
              <DeleteIcon />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default function SubscriptionList() {
  const [sub, setSub] = React.useState<Subscription>({ name: '', url: '' });
  const ref = React.useRef<HTMLDialogElement>(null);
  const items = useLiveQuery(() => db.subs.toArray(), []) ?? [];

  return (
    <>
      <table className="table">
        <tbody>
          {items.map((item) => (
            <SubscriptionRow
              key={item.id}
              sub={item}
              onEdit={(sub) => {
                setSub(sub);
                ref.current?.showModal();
              }}
            />
          ))}
        </tbody>
      </table>
      <SubscriptionDialog
        ref={ref}
        onClose={async (values) => {
          ref.current?.close();

          if (values?.id) {
            await db.subs.update(values.id, values);
          }
        }}
        sub={sub}
      />
    </>
  );
}
