import { invoke } from '@tauri-apps/api/tauri';
import { decode } from 'js-base64';
import db from '../db';
import Endpoint from '../db/endpoint';
import { Subscription } from '../db/subscription';
import { selectFastest } from './currentEndpoint';
import { testLatencies } from './endpointTest';
import { setSubUpdating, updatingSubs } from './useSubscriptionUpdating';
import { parseTrojan } from './xray/protocols/trojan';
import { parseVMess as parseVmess } from './xray/protocols/vmess';

// const SCHEME_HTTP = 'http://';
// const SCHEME_HTTPS = 'https://';
// const SCHEME_SOCKS = 'socks://';
// const SCHEME_SS = 'ss://';
// const SCHEME_TROJAN = 'trojan://';
// const SCHEME_VLESS = 'vless://';
// const SCHEME_VMESS = 'vmess://';

const urlToEndpoint = (s: string) => {
  try {
    const url = new URL(s);

    switch (url.protocol) {
      case 'vmess:':
        return parseVmess(url);
      case 'trojan:':
        return parseTrojan(url);
      default:
        console.warn('Unsupported protocol', s);
        break;
    }
  } catch (e) {
    console.warn('Failed to parse url', e);
  }

  return null;
};

/**
 * 更新指定订阅
 * @param sub 要更新的订阅
 */
export const updateSubscription = async (sub: Subscription) => {
  if (updatingSubs.get().has(sub.id!)) {
    // 不能重复更新
    return;
  }

  console.log(`Updating sub ${sub.name}`);
  setSubUpdating(sub.id!, true);

  // 下载订阅
  const body = await invoke<string>('download', { url: sub.url });
  // base64
  const text = decode(body);
  // 按行分割
  const lines = text.split('\n');

  // 删除原有的
  const removed = await db.endpoints.where('subId').equals(sub.id!).delete();
  console.log(`${removed} endpoints removed`);

  const eps: Endpoint[] = [];

  for (const line of lines) {
    const ep = urlToEndpoint(line);

    if (ep) {
      ep.subId = sub.id;
      eps.push(ep);
    }
  }

  if (eps.length > 0) {
    await db.endpoints.bulkPut(eps);
    console.log(`${eps.length} endpoints added`);
  }

  setSubUpdating(sub.id!, false);

  // 更新后自动测试延迟
  await testLatencies(eps);
};

/** 更新订阅 */
export const updateSubscriptions = async () => {
  console.info('Updating subscriptions now');

  const subs = await db.subs.toArray();
  await Promise.allSettled(subs.map(updateSubscription));

  console.info('Subscriptions updated');

  // 更新后自动选择最快的节点
  await selectFastest();
};
