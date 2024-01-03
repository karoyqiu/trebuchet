import { invoke } from '@tauri-apps/api/tauri';
import { retry } from 'radash';
import { debug, error } from 'tauri-plugin-log-api';
import db from '../db';
import Endpoint from '../db/endpoint';
import Xray from './xray/xray';

export const testLatency = async (proxyPort: number) => {
  try {
    await debug(`Testing on port ${proxyPort}`);
    const latency = await invoke<number>('test_latency', { proxyPort });
    return latency;
  } catch (e) {
    // 测试失败
    // @ts-expect-error: 未知就未知吧
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    await error(`Test error on port ${proxyPort}`, { keyValues: { msg: e.toString() } });
    return 999999;
  }
};

const startXray = async (ep: Endpoint) => {
  const xray = new Xray();

  try {
    await xray.start(ep, true);
    await debug(`Xray started on ${xray.apiPort} for endpoint ${ep.name}`);
    return xray;
  } catch (e) {
    await xray.stop();
    return null;
  }
};

// 测试指定节点列表的延迟
export const testLatencies = async (eps: Endpoint[]) => {
  await Promise.all(
    eps.map((ep) => db.endpoints.where('id').equals(ep.id).modify({ latency: -1 })),
  );

  const xrays: (Xray | null)[] = [];

  // 这里一个一个地启动，因为每次都要找一个未使用的端口
  for (const ep of eps) {
    const xray = await retry({}, () => startXray(ep));
    xrays.push(xray);
  }

  // 然后同时测试延迟
  await Promise.allSettled(
    eps.map(async (ep, index) => {
      const xray = xrays[index];

      if (xray) {
        const latency = await testLatency(xray.apiPort);
        await Promise.allSettled([
          db.endpoints.where('id').equals(ep.id).modify({ latency }),
          xray.stop(),
        ]);
      }
    }),
  );

  await Promise.all(xrays.map((xray) => xray?.stop()));
};
