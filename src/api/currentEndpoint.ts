import { entity } from 'simpler-state';
import Endpoint from '../db/endpoint';

export const current = entity<Endpoint | null>(null);

/**
 * 判断指定节点是否为当前正在使用的节点。
 * @param ep 节点
 * @returns 是否为当前正在使用的节点
 */
export const isCurrent = (ep: Endpoint) => {
  const cur = current.get();
  return cur?.host === ep.host && cur.port === ep.port;
};

/**
 * 设置当前节点。
 * @param ep 节点
 */
export const setCurrent = async (ep: Endpoint) => {
  current.set(ep);
  await window.xray.stop();
  await window.xray.start(ep);
};
