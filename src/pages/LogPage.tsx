import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';

export default function LogPage() {
  const logs = useLiveQuery(() => db.logEntries.reverse().toArray(), []) ?? [];

  return (
    <div className="h-full overflow-y-auto">
      <table className="table font-mono">
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="hover">
              <td>{log.log}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
