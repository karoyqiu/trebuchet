import { invoke } from '@tauri-apps/api/tauri';
import db from '../db';
import Endpoint from '../db/endpoint';
import Xray from './xray/xray';

export const testLatency = async (proxyPort: number) => {
  try {
    console.debug(`Testing on port ${proxyPort}`);
    const latency = await invoke<number>('test_latency', { proxyPort });
    return latency;
  } catch (e) {
    // 测试失败
    console.error(`Test error on port ${proxyPort}`, e);
    return 999999;
  }
};

// 测试指定节点列表的延迟
export const testLatencies = async (eps: Endpoint[]) => {
  await Promise.all(
    eps.map((ep) => db.endpoints.where('id').equals(ep.id).modify({ latency: -1 }))
  );

  const xrays: Xray[] = [];

  // 这里一个一个地启动，因为每次都要找一个未使用的端口
  for (const ep of eps) {
    const xray = new Xray();
    await xray.start(ep, true);
    xrays.push(xray);
  }

  // 然后同时测试延迟
  await Promise.allSettled(
    eps.map(async (ep, index) => {
      const xray = xrays[index];
      const latency = await testLatency(xray.apiPort);
      await Promise.allSettled([
        db.endpoints.where('id').equals(ep.id).modify({ latency }),
        xray.stop(),
      ]);
    })
  );
};
