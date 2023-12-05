import { useEffect } from 'react';
import { testLatency } from './endpointTest';
import settings from './settings';
import { updateSubscriptions } from './subscription';

/** 定时更新订阅 */
const useSubscribe = () => {
  const { epTestInterval, socksPort } = settings.use();

  // useEffect(() => {
  //   if (subUpdateInterval > 0) {
  //     console.log(`Updating subscriptions every ${subUpdateInterval} minutes.`);
  //     const timer = setInterval(updateSubscriptions, subUpdateInterval * 60 * 1000);
  //     return () => clearInterval(timer);
  //   }
  // }, [subUpdateInterval]);

  useEffect(() => {
    if (epTestInterval > 0) {
      console.log(`Testing latency every ${epTestInterval} minutes.`);

      const timer = setInterval(async () => {
        // 测试当前节点的速度
        const latency = await testLatency(socksPort);
        console.debug(`Checked latency: ${latency}ms`);

        // 如果当前节点不通了，则更新订阅
        if (latency > 30000) {
          await updateSubscriptions();
        }
      }, epTestInterval * 60 * 1000);

      return () => clearInterval(timer);
    }
  }, [epTestInterval, socksPort]);
};

export default useSubscribe;
