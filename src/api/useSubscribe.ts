import { useEffect } from 'react';
import { debug, info } from 'tauri-plugin-log-api';
import { testLatency } from './endpointTest';
import { getSettings, useSettings } from './settings';
import { updateSubscriptions } from './subscription';

/** 定时更新订阅 */
const useSubscribe = () => {
  const { epTestInterval, socksPort } = useSettings();

  // useEffect(() => {
  //   if (subUpdateInterval > 0) {
  //     log(`Updating subscriptions every ${subUpdateInterval} minutes.`);
  //     const timer = setInterval(updateSubscriptions, subUpdateInterval * 60 * 1000);
  //     return () => clearInterval(timer);
  //   }
  // }, [subUpdateInterval]);

  useEffect(() => {
    if (epTestInterval > 0) {
      info(`Testing latency every ${epTestInterval} minutes.`).catch(() => {});

      const timer = setInterval(
        async () => {
          // 测试当前节点的速度
          const { epTestUrl } = getSettings();
          const latency = await testLatency(socksPort, epTestUrl);
          await debug(`Checked latency: ${latency}ms`);

          // 如果当前节点不通了，则更新订阅
          if (latency > 30000) {
            await updateSubscriptions();
          }
        },
        epTestInterval * 60 * 1000,
      );

      return () => clearInterval(timer);
    }
  }, [epTestInterval, socksPort]);
};

export default useSubscribe;
