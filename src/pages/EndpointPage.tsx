import NetworkCheckIcon from '@material-symbols/svg-400/outlined/network_check.svg?react';
import { selectFastestEndpoint } from '../api/bindings';
import CommandButton from '../components/CommandButton';
import EndpointList from '../components/EndpointList';

export default function EndpointPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="join p-2">
        <CommandButton className="btn-ghost join-item" onClick={selectFastestEndpoint}>
          <NetworkCheckIcon />
          Test latencies
        </CommandButton>
      </div>
      <div className="divider m-0 h-0" />
      <div className="min-h-0 grow overflow-y-auto">
        <EndpointList />
      </div>
    </div>
  );
}
