import { invoke } from '@tauri-apps/api/tauri';
import { decode } from 'js-base64';
import { fork, sift } from 'radash';
import { error, info, warn } from 'tauri-plugin-log-api';
import { parse as parseUri } from 'uri-js';
import db from '../db';
import { Subscription } from '../db/subscription';
import { selectFastest } from './currentEndpoint';
import { testLatencies } from './endpointTest';
import { setSubUpdating, updatingSubs } from './useSubscriptionUpdating';
import parseShadowsocks from './xray/protocols/shadowsocks';
import parseTrojan from './xray/protocols/trojan';
import parseVLESS from './xray/protocols/vless';
import parseVMess from './xray/protocols/vmess';

const { DEV } = import.meta.env;

const urlToEndpoint = async (s: string) => {
  try {
    const uri = parseUri(s, { tolerant: true, iri: true, unicodeSupport: true });

    switch (uri.scheme) {
      case 'vmess':
        return parseVMess(s);
      case 'trojan':
        return parseTrojan(uri);
      case 'ss':
        return parseShadowsocks(uri);
      case 'vless':
        return parseVLESS(uri);
      default:
        await warn(`Unsupported protocol: ${s}`);
        break;
    }
  } catch (e) {
    await warn('Failed to parse url');
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

  await info(`Updating sub ${sub.name}`);
  setSubUpdating(sub.id!, true);

  // 下载订阅
  const body = await invoke<string>('download', { url: sub.url });
  // base64
  const text = decode(body);
  // 按行分割
  const lines = text.split('\n');

  // 删除原有的
  const removed = await db.endpoints.where('subId').equals(sub.id!).delete();
  await info(`${removed} endpoints removed`);

  const eps = sift(
    await Promise.all(
      lines.map(async (line) => {
        const ep = await urlToEndpoint(line.trim());

        if (ep) {
          ep.subId = sub.id;
        }

        return ep;
      })
    )
  );

  if (eps.length > 0) {
    await db.endpoints.bulkPut(eps);
    await info(`${eps.length} endpoints added`);
  }

  setSubUpdating(sub.id!, false);

  // 更新后自动测试延迟
  if (!DEV) {
    await testLatencies(eps);
  }
};

/** 更新订阅 */
export const updateSubscriptions = async () => {
  await info('Updating subscriptions now');

  const subs = await db.subs.toArray();

  // 按启用/禁用分组，删除所有禁用的节点
  const [enabled, disabled] = fork(subs, (sub) => !sub.disabled);
  await db.endpoints
    .where('subId')
    .anyOf(disabled.map((sub) => sub.id!))
    .delete();

  const results = await Promise.allSettled(enabled.map(updateSubscription));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    if (result.status === 'rejected') {
      const sub = enabled[i];
      await error(`Failed to update subscription ${sub.name}`, {
        keyValues: { reason: `${result.reason}` },
      });
      setSubUpdating(sub.id!, false);
    }
  }

  await info('Subscriptions updated');

  // 更新后自动选择最快的节点
  if (!DEV) {
    await selectFastest();
  }
};
