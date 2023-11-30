import SubscriptionList from '../components/SubscriptionList';

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col max-h-full">
      <div className="join p-1">
        <button className="btn">Update</button>
      </div>
      <div className="divider m-0 h-0" />
      <div className="min-h-0 overflow-y-auto">
        <SubscriptionList />
      </div>
    </div>
  );
}
