import { useEffect } from 'react';
import db from '../db';
import { selectFastest } from './currentEndpoint';
import { testLatencies } from './endpointTest';
import settings from './settings';
import { updateSubscriptions } from './subscription';

/** 定时更新订阅 */
const useSubscribe = () => {
  const { subUpdateInterval, epTestInterval } = settings.use();

  useEffect(() => {
    console.log(`Updating subscriptions every ${subUpdateInterval} minutes.`);
    const timer = setInterval(updateSubscriptions, subUpdateInterval * 60 * 1000);
    return () => clearInterval(timer);
  }, [subUpdateInterval]);

  useEffect(() => {
    console.log(`Testing latency every ${epTestInterval} minutes.`);
    const timer = setInterval(async () => {
      const all = await db.endpoints.toArray();
      await testLatencies(all);
      await selectFastest();
    }, epTestInterval * 60 * 1000);
    return () => clearInterval(timer);
  }, [epTestInterval]);
};

export default useSubscribe;
