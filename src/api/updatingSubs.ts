import { entity } from 'simpler-state';
import { dbGetUpdatingSubscriptionIds } from './bindings';

/** 正在更新的订阅 */
export const updatingSubs = entity(dbGetUpdatingSubscriptionIds());

export const reloadUpdatingSubs = async () => {
  const value = await dbGetUpdatingSubscriptionIds();
  updatingSubs.set(value);
};
