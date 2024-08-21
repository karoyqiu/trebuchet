import { logs } from '../db/logEntry';

export default function LogPage() {
  const logEntries = logs.use() ?? [];

  return (
    <div className="h-full overflow-y-auto">
      <table className="table font-mono">
        <tbody>
          {logEntries.map((log) => (
            <tr key={log.id} className="hover">
              <td>{log.log}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
