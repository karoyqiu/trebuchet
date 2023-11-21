import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';
import db from '../db';
import { Subscription } from '../db/subscription';
import SubscriptionDialog from './SubscriptionDialog';

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
                <p className="text-lg font-bold">{item.name}</p>
                <p className="text-sm opacity-50">{item.url}</p>
              </td>
              <td className="w-0">
                <div className="join">
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
