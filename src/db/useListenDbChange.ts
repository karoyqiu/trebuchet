import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { reloadCurrent } from '../api/currentEndpoint';
import { reloadEndpoints } from './endpoint';
import { reloadSubscriptions } from './subscription';

const useListenDbChange = () => {
  useEffect(() => {
    const unlisten = Promise.all([
      listen('app://db/subscription', reloadSubscriptions),
      listen('app://db/endpoint', reloadEndpoints),
      listen('app://endpoint/current', reloadCurrent),
    ]);

    return () => {
      unlisten.then((fns) => {
        for (const fn of fns) {
          fn();
        }
      });
    };
  }, []);
};

export default useListenDbChange;
