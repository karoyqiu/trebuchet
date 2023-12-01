import { useEffect } from 'react';
import settings from './settings';
import { updateSubscriptions } from './subscription';

/** 定时更新订阅 */
const useSubscribe = () => {
  const { subUpdateInterval } = settings.use();

  useEffect(() => {
    console.log(`Updating subscriptions every ${subUpdateInterval} minutes.`);
    const timer = setInterval(updateSubscriptions, subUpdateInterval * 60 * 1000);
    return () => clearInterval(timer);
  }, [subUpdateInterval]);
};

export default useSubscribe;
