import { invoke } from '@tauri-apps/api/tauri';
import { retry } from 'radash';
import { debug, error } from 'tauri-plugin-log-api';
import db from '../db';
import Endpoint from '../db/endpoint';
import SimpleQueue from './SimpleQueue';
import { getSettings } from './settings';
import Xray from './xray/xray';

export const testLatency = async (proxyPort: number, url: string) => {
  try {
    await debug(`Testing on port ${proxyPort}`);
    const latency = await invoke<number>('test_latency', { proxyPort, url });
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
    await xray.start(ep, 'test');
    await debug(`Xray started on ${xray.apiPort} for endpoint ${ep.name}`);
    return xray;
  } catch (e) {
    await xray.stop();
    return null;
  }
};

// 测试指定节点列表的延迟
export const testLatencies = async (eps: Endpoint[], concurrency?: number) => {
  await Promise.all(
    eps.map((ep) => db.endpoints.where('id').equals(ep.id).modify({ latency: -1 })),
  );

  //const xrays: (Xray | null)[] = [];
  const xrays = new SimpleQueue<Xray>();
  const tests: Promise<void>[] = [];
  const { epTestUrl } = getSettings();

  const test = async (xray: Xray) => {
    const latency = await testLatency(xray.apiPort, epTestUrl);
    await Promise.allSettled([
      db.endpoints.where('id').equals(xray.endpointId).modify({ latency }),
      xray.stop(),
    ]);
    xrays.remove(xray);
  };

  // 这里一个一个地启动，因为每次都要找一个未使用的端口
  const limit = concurrency ?? getSettings().epTestConcurrency;

  for (const ep of eps) {
    await xrays.waitForAvailable(limit);
    const xray = await retry({}, () => startXray(ep));

    if (xray) {
      xrays.enqueue(xray);
      tests.push(test(xray));
    } else {
      await Promise.all([
        error(`Failed to start xray for ${ep.name}`),
        db.endpoints.where('id').equals(ep.id).modify({ latency: 999999 }),
      ]);
    }
  }

  // 然后同时测试延迟
  await Promise.allSettled(tests);

  // 到这里，xrays 应该为空
  if (xrays.length > 0) {
    await error('What the fuck?!');
  }
};
