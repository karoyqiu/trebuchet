import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';
import xray from '../api/xray/xray';
import db from '../db';
import LatencyBadge from './LatencyBadge';

export default function EndpointList() {
  const items = useLiveQuery(() => db.endpoints.toCollection().sortBy('latency'), []) ?? [];
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
            <td className="whitespace-nowrap">
              <div className="badge badge-sm">{item.protocol}</div>
              <LatencyBadge latency={item.latency ?? 0} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
