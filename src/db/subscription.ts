import { entity } from 'simpler-state';
import { dbCountSubscriptions, dbQuerySubscriptions } from '../api/bindings';

export type { Subscription } from '../api/bindings';

export const subscriptions = entity(dbQuerySubscriptions());
export const subscriptionCount = entity(dbCountSubscriptions());

export const reloadSubscriptions = async () => {
  const [items, count] = await Promise.all([dbQuerySubscriptions(), dbCountSubscriptions()]);
  subscriptions.set(items);
  subscriptionCount.set(count);
};
