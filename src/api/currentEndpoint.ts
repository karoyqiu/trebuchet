import { entity } from 'simpler-state';
import { getCurrentEndpoint, type Endpoint } from './bindings';

export const current = entity(getCurrentEndpoint());

export const reloadCurrent = async () => {
  const id = await getCurrentEndpoint();
  current.set(id);
};

/**
 * 判断指定节点是否为当前正在使用的节点。
 * @param ep 节点
 * @returns 是否为当前正在使用的节点
 */
export const isCurrent = (ep: Endpoint) => {
  const cur = current.get();
  return ep.id === cur;
};
