import { setCurrentEndpoint } from '../api/bindings';
import { current } from '../api/currentEndpoint';
import { endpoints } from '../db/endpoint';
import { subscriptions } from '../db/subscription';
import LatencyBadge from './LatencyBadge';

const getProtocol = (uri: string) => {
  const pos = uri.indexOf('://');

  if (pos >= 0) {
    return uri.substring(0, pos);
  }

  return '<?>';
};

export default function EndpointList() {
  const subs = subscriptions.use() ?? [];
  const items = endpoints.use() ?? [];
  const cur = current.use();

  const getSubname = (subId?: number) => {
    const sub = subs.find((s) => s.id === subId);
    return sub?.name ?? '--';
  };

  return (
    <table className="table">
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className={item.id === cur ? 'bg-accent text-accent-content' : 'hover cursor-pointer'}
            onClick={() => setCurrentEndpoint(item.id)}
          >
            <td className="w-full">
              <p className="text-lg font-bold">{item.name}</p>
              <p className="text-sm opacity-50 truncate max-w-xl">{`${item.host}:${item.port}`}</p>
            </td>
            <td>
              <div className="badge badge-sm">{getSubname(item.subId)}</div>
            </td>
            <td>
              <div className="badge badge-sm">{getProtocol(item.uri)}</div>
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
