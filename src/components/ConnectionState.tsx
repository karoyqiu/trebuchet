import clsx from 'clsx';

type ConnectionStateProps = {
  connected: boolean;
  seconds: number;
};

export default function ConnectionState(props: ConnectionStateProps) {
  const { connected, seconds } = props;

  return (
    <div className="flex flex-col gap-2 items-center text-sm">
      <span className="countdown font-mono">
        {/** @ts-expect-error: --value 属性给 countdown 用的 */}
        <span style={{ '--value': Math.floor(seconds / 3600) }} />:
        {/** @ts-expect-error: --value 属性给 countdown 用的 */}
        <span style={{ '--value': Math.floor((seconds % 3600) / 60) }} />:
        {/** @ts-expect-error: --value 属性给 countdown 用的 */}
        <span style={{ '--value': seconds % 60 }} />
      </span>
      <div className="flex gap-2 items-center">
        <span className={clsx('badge badge-xs', connected ? 'badge-success' : 'badge-error')} />
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
}
