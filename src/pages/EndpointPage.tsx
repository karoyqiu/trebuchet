import NetworkCheckIcon from '@material-symbols/svg-400/outlined/network_check.svg?react';
import { selectFastest } from '../api/currentEndpoint';
import { testLatencies } from '../api/endpointTest';
import EndpointList from '../components/EndpointList';
import db from '../db';

export default function EndpointPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="join p-2">
        <button
          className="btn btn-ghost join-item"
          onClick={async () => {
            const all = await db.endpoints.toArray();
            await testLatencies(all);
            await selectFastest();
          }}
        >
          <NetworkCheckIcon />
          Test speed
        </button>
      </div>
      <div className="divider m-0 h-0" />
      <div className="min-h-0 grow overflow-y-auto">
        <EndpointList />
      </div>
    </div>
  );
}
