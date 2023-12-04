import { invoke } from '@tauri-apps/api/tauri';
import db from '../db';
import Endpoint from '../db/endpoint';
import { Xray } from './xray/xray';

const testLatency = async (ep: Endpoint, proxyPort: number) => {
  try {
    const latency = await invoke<number>('test_latency', { proxyPort });
    await db.endpoints.where('id').equals(ep.id).modify({ latency });
  } catch (e) {
    // 测试失败
    await db.endpoints.where('id').equals(ep.id).modify({ latency: 999999 });
  }
};

// 测试指定节点列表的延迟
export const testLatencies = async (eps: Endpoint[]) => {
  await db.endpoints.toCollection().modify({ latency: -1 });

  const xrays: Xray[] = [];

  // 这里一个一个地启动，因为每次都要找一个未使用的端口
  for (const ep of eps) {
    const xray = new Xray();
    await xray.start(ep, true);
    xrays.push(xray);
  }

  // 然后同时测试延迟
  await Promise.all(
    eps.map(async (ep, index) => {
      const xray = xrays[index];
      await testLatency(ep, xray.apiPort);
      await xray.stop();
    })
  );
};
