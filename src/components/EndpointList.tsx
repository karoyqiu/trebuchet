import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';
import db from '../db';

export default function EndpointList() {
  const items = useLiveQuery(() => db.endpoints.toArray(), []) ?? [];
  const [selected, setSelected] = React.useState('');

  return (
    <table className="table">
      <tbody>
        {items.map((item) => {
          const key = `${item.host}:${item.port}`;

          return (
            <tr
              key={key}
              className={
                selected === key ? 'bg-accent text-accent-content' : 'hover cursor-pointer'
              }
              onClick={() => setSelected(key)}
            >
              <td className="w-full">
                <p className="text-lg font-bold">{item.name}</p>
                <p className="text-sm opacity-50">{`${item.host}:${item.port}`}</p>
              </td>
              <td>
                <div className="badge">{item.protocol}</div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
