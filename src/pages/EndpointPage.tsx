import EndpointList from '../components/EndpointList';
import MaterialSymbol from '../components/MaterialSymbol';

export default function EndpointPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="join p-2">
        <button className="btn btn-ghost join-item">
          <MaterialSymbol symbol="network_check" />
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
