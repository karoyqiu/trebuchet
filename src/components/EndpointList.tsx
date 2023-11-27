import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';

export default function EndpointList() {
  const items = useLiveQuery(() => db.endpoints.toArray(), []) ?? [];

  return (
    <table className="table">
      <tbody>
        {items.map((item) => (
          <tr key={`${item.host}:${item.port}`} className="hover">
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
