import { useLiveQuery } from 'dexie-react-hooks';
import { current, setCurrent } from '../api/currentEndpoint';
import db from '../db';
import LatencyBadge from './LatencyBadge';

export default function EndpointList() {
  const items = useLiveQuery(() => db.endpoints.toCollection().sortBy('latency'), []) ?? [];
  const cur = current.use();

  return (
    <table className="table">
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className={
              cur?.host === item.host && cur.port === item.port
                ? 'bg-accent text-accent-content'
                : 'hover cursor-pointer'
            }
            onClick={() => setCurrent(item)}
          >
            <td className="w-full">
              <p className="text-lg font-bold">{item.name}</p>
              <p className="text-sm opacity-50 truncate max-w-xl">{`${item.host}:${item.port}`}</p>
            </td>
            <td>
              <div className="badge badge-sm">{item.outbound.protocol}</div>
            </td>
            <td className="whitespace-nowrap text-end">
              <LatencyBadge latency={item.latency ?? 0} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
