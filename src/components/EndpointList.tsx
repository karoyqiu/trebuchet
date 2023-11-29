import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';
import xray from '../api/xray/xray';
import db from '../db';

export default function EndpointList() {
  const items = useLiveQuery(() => db.endpoints.toArray(), []) ?? [];
  const [selected, setSelected] = React.useState('');

  return (
    <table className="table">
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className={
              selected === item.id ? 'bg-accent text-accent-content' : 'hover cursor-pointer'
            }
            onClick={async () => {
              await xray.stop();
              await xray.start(item);
              setSelected(item.id);
            }}
          >
            <td className="w-full">
              <p className="text-lg font-bold">{item.name}</p>
              <p className="text-sm opacity-50">{`${item.host}:${item.port}`}</p>
            </td>
            <td>
              <div className="badge">{item.protocol}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
