import { setCurrentEndpoint } from '../api/bindings';
import { current } from '../api/currentEndpoint';
import { updateSettings, useSettings } from '../api/settings';

export default function RulePage() {
  const settings = useSettings();

  const changeRule = async (rule: string) => {
    await updateSettings({ rule });

    const cur = current.get();

    if (cur) {
      await setCurrentEndpoint(cur);
    }
  };

  return (
    <table className="table">
      <tbody>
        <tr
          className={
            settings.rule === 'default' ? 'bg-accent text-accent-content' : 'hover cursor-pointer'
          }
          onClick={() => changeRule('default')}
        >
          <td className="w-full">
            <p className="text-lg font-bold">Default</p>
            <p className="text-sm opacity-50">Bypass websites in China & block ads</p>
          </td>
        </tr>
        <tr
          className={
            settings.rule === 'all' ? 'bg-accent text-accent-content' : 'hover cursor-pointer'
          }
          onClick={() => changeRule('all')}
        >
          <td className="w-full">
            <p className="text-lg font-bold">All</p>
            <p className="text-sm opacity-50">Proxy all requests</p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
