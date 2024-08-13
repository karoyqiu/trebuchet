import { entity } from 'simpler-state';
import { object, string } from 'yup';
import { dbCountSubscriptions, dbQuerySubscriptions } from '../api/bindings';

export type { Subscription } from '../api/bindings';

export const subscriptionSchema = object({
  name: string().required(),
  url: string().required(),
});

export const subscriptions = entity(dbQuerySubscriptions());
export const subscriptionsCount = entity(dbCountSubscriptions());

export const reloadSubscriptions = async () => {
  const [items, count] = await Promise.all([dbQuerySubscriptions(), dbCountSubscriptions()]);
  subscriptions.set(items);
  subscriptionsCount.set(count);
};
