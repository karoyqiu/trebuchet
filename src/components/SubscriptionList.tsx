import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';
import { updateSubscription } from '../api/useSubscribe';
import db from '../db';
import { Subscription } from '../db/subscription';
import SubscriptionDialog from './SubscriptionDialog';

const enableSub = (id: number, enabled: boolean) => db.subs.update(id, { disabled: !enabled });

export default function SubscriptionList() {
  const [sub, setSub] = React.useState<Subscription>({ name: '', url: '' });
  const ref = React.useRef<HTMLDialogElement>(null);
  const items = useLiveQuery(() => db.subs.toArray(), []) ?? [];

  return (
    <>
      <table className="table">
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="hover">
              <td>
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={!item.disabled}
                    onChange={(event) => enableSub(item.id!, event.target.checked)}
                  />
                </label>
              </td>
              <td className="w-full">
                <p className="text-lg font-bold">{item.name}</p>
                <p className="text-sm opacity-50">{item.url}</p>
              </td>
              <td>
                <div className="join">
                  <button className="btn join-item" onClick={() => updateSubscription(item)}>
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                  <button
                    className="btn join-item"
                    onClick={() => {
                      setSub(item);
                      ref.current?.showModal();
                    }}
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="btn btn-error join-item">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SubscriptionDialog
        ref={ref}
        onClose={() => {
          ref.current?.close();
        }}
        sub={sub}
      />
    </>
  );
}
