import { invoke } from '@tauri-apps/api/tauri';
import { decode } from 'js-base64';
import { nanoid } from 'nanoid';
import { useEffect } from 'react';
import db from '../db';
import { Endpoint } from '../db/endpoint';
import { Subscription } from '../db/subscription';

// const SCHEME_HTTP = 'http://';
// const SCHEME_HTTPS = 'https://';
// const SCHEME_SOCKS = 'socks://';
// const SCHEME_SS = 'ss://';
// const SCHEME_TROJAN = 'trojan://';
// const SCHEME_VLESS = 'vless://';
// const SCHEME_VMESS = 'vmess://';

const fromVmess = (url: URL) => {
  const ep: Endpoint = {
    id: nanoid(),
    protocol: 'vmess',
    
  };

  return ep;
};

const updateSubscription = async (sub: Subscription) => {
  // 下载订阅
  const body = await invoke<string>('download', { url: sub.url });
  // base64
  const text = decode(body);
  // 按行分割
  const lines = text.split('\n');

  for (const line of lines) {
    const url = new URL(line);

    switch (url.protocol) {
      case 'vmess:':
        break;
      default:
        console.warn('Unknown protocol', line);
        break;
    }
  }
};

/** 更新订阅 */
const updateSubscriptions = async () => {
  console.info('Updating subscriptions');

  const subs = await db.subs.toArray();
  await Promise.allSettled(subs.map(updateSubscription));

  console.info('Subscriptions updated');
};

/** 定时更新订阅 */
const useSubscribe = () => {
  useEffect(() => {
    // 1 小时更新一次
    const timer = setInterval(updateSubscriptions, 60 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);
};

export default useSubscribe;
