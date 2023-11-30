import EndpointList from '../components/EndpointList';

export default function EndpointPage() {
  return (
    <div className="flex flex-col max-h-full">
      <div className="join p-1">
        <button className="btn">Test speed</button>
      </div>
      <div className="divider m-0 h-0" />
      <div className="min-h-0 overflow-y-auto">
        <EndpointList />
      </div>
    </div>
  );
}
